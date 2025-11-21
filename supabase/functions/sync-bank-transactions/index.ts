import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get connected bank accounts
    const { data: bankAccounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (accountsError) {
      console.error('Error fetching bank accounts:', accountsError)
      throw new Error('Failed to fetch bank accounts')
    }

    if (!bankAccounts || bankAccounts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No connected bank accounts found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Plaid configuration
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'

    let totalTransactionsSynced = 0

    if (!plaidClientId || !plaidSecret) {
      // Demo mode - create mock transactions
      for (const account of bankAccounts) {
        const mockTransactions = [
          {
            bank_account_id: account.id,
            transaction_date: new Date().toISOString().split('T')[0],
            description: 'Demo Deposit - Salary',
            amount: 3500.00,
            transaction_type: 'credit',
            status: 'unmatched',
            reference_number: 'DEMO001',
            user_id: user_id,
            plaid_transaction_id: `demo_${account.id}_credit`
          },
          {
            bank_account_id: account.id,
            transaction_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            description: 'Demo Payment - Office Supplies',
            amount: -125.50,
            transaction_type: 'debit',
            status: 'unmatched',
            reference_number: 'DEMO002',
            user_id: user_id,
            plaid_transaction_id: `demo_${account.id}_debit1`
          },
          {
            bank_account_id: account.id,
            transaction_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            description: 'Demo Transfer - Client Payment',
            amount: 1200.00,
            transaction_type: 'credit',
            status: 'unmatched',
            reference_number: 'DEMO003',
            user_id: user_id,
            plaid_transaction_id: `demo_${account.id}_credit2`
          }
        ]

        // Check if transactions already exist
        for (const transaction of mockTransactions) {
          const { data: existing } = await supabase
            .from('bank_transactions')
            .select('id')
            .eq('plaid_transaction_id', transaction.plaid_transaction_id)
            .single()

          if (!existing) {
            const { error: insertError } = await supabase
              .from('bank_transactions')
              .insert([transaction])

            if (!insertError) {
              totalTransactionsSynced++
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          transactions_synced: totalTransactionsSynced,
          message: 'Demo transactions synced successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Real Plaid integration
    for (const account of bankAccounts) {
      if (!account.plaid_access_token) continue

      // Get recent transactions (last 30 days)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date()

      const transactionsRequest = await fetch(`https://${plaidEnv}.plaid.com/transactions/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PLAID-CLIENT-ID': plaidClientId,
          'PLAID-SECRET': plaidSecret,
        },
        body: JSON.stringify({
          access_token: account.plaid_access_token,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          account_ids: [account.plaid_account_id]
        })
      })

      const transactionsResponse = await transactionsRequest.json()

      if (!transactionsRequest.ok) {
        console.error('Plaid transactions error:', transactionsResponse)
        continue
      }

      // Process and store transactions
      for (const transaction of transactionsResponse.transactions) {
        // Check if transaction already exists
        const { data: existing } = await supabase
          .from('bank_transactions')
          .select('id')
          .eq('plaid_transaction_id', transaction.transaction_id)
          .single()

        if (existing) continue

        const transactionData = {
          bank_account_id: account.id,
          transaction_date: transaction.date,
          description: transaction.name || 'Unknown Transaction',
          amount: -transaction.amount, // Plaid uses negative for debits
          transaction_type: transaction.amount > 0 ? 'debit' : 'credit',
          status: 'unmatched',
          reference_number: transaction.reference || null,
          category: transaction.category?.join(', ') || null,
          user_id: user_id,
          plaid_transaction_id: transaction.transaction_id
        }

        const { error: insertError } = await supabase
          .from('bank_transactions')
          .insert([transactionData])

        if (!insertError) {
          totalTransactionsSynced++
        }
      }
    }

    // Update last sync timestamps
    await supabase
      .from('bank_accounts')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('is_active', true)

    return new Response(
      JSON.stringify({ 
        success: true,
        transactions_synced: totalTransactionsSynced
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in sync-bank-transactions:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})