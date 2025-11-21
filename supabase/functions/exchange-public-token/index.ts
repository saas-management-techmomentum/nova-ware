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
    const { public_token, user_id } = await req.json()

    if (!public_token || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Public token and user ID are required' }),
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

    // Plaid configuration
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'

    if (!plaidClientId || !plaidSecret) {
      // Demo mode - create mock accounts
      const mockAccounts = [
        {
          bank_name: 'Demo Bank',
          account_number: '****1234',
          account_type: 'checking',
          current_balance: 5000.00,
          opening_balance: 5000.00,
          currency: 'USD',
          is_active: true,
          user_id: user_id,
          plaid_account_id: 'demo_account_checking',
          plaid_access_token: 'demo_access_token'
        },
        {
          bank_name: 'Demo Credit Union',
          account_number: '****5678',
          account_type: 'savings',
          current_balance: 15000.00,
          opening_balance: 15000.00,
          currency: 'USD',
          is_active: true,
          user_id: user_id,
          plaid_account_id: 'demo_account_savings',
          plaid_access_token: 'demo_access_token'
        }
      ]

      // Insert mock accounts into database
      const { error: insertError } = await supabase
        .from('bank_accounts')
        .insert(mockAccounts)

      if (insertError) {
        console.error('Error inserting mock accounts:', insertError)
        throw new Error('Failed to create demo accounts')
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          accounts_added: mockAccounts.length,
          message: 'Demo accounts created successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Exchange public token for access token
    const exchangeRequest = await fetch(`https://${plaidEnv}.plaid.com/link/token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': plaidClientId,
        'PLAID-SECRET': plaidSecret,
      },
      body: JSON.stringify({
        public_token: public_token
      })
    })

    const exchangeResponse = await exchangeRequest.json()

    if (!exchangeRequest.ok) {
      console.error('Plaid exchange error:', exchangeResponse)
      throw new Error('Failed to exchange public token')
    }

    const accessToken = exchangeResponse.access_token
    const itemId = exchangeResponse.item_id

    // Get account information
    const accountsRequest = await fetch(`https://${plaidEnv}.plaid.com/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': plaidClientId,
        'PLAID-SECRET': plaidSecret,
      },
      body: JSON.stringify({
        access_token: accessToken
      })
    })

    const accountsResponse = await accountsRequest.json()

    if (!accountsRequest.ok) {
      console.error('Plaid accounts error:', accountsResponse)
      throw new Error('Failed to fetch account information')
    }

    // Get institution information
    const institutionRequest = await fetch(`https://${plaidEnv}.plaid.com/institutions/get_by_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': plaidClientId,
        'PLAID-SECRET': plaidSecret,
      },
      body: JSON.stringify({
        institution_id: accountsResponse.item.institution_id,
        country_codes: ['US']
      })
    })

    const institutionResponse = await institutionRequest.json()
    const institutionName = institutionResponse.institution?.name || 'Unknown Bank'

    // Store accounts in database
    const accountsToInsert = accountsResponse.accounts.map((account: any) => ({
      bank_name: institutionName,
      account_number: `****${account.mask}`,
      account_type: account.subtype || account.type,
      current_balance: account.balances.current || 0,
      opening_balance: account.balances.current || 0,
      currency: account.balances.iso_currency_code || 'USD',
      is_active: true,
      user_id: user_id,
      plaid_account_id: account.account_id,
      plaid_access_token: accessToken,
      plaid_item_id: itemId
    }))

    const { error: insertError } = await supabase
      .from('bank_accounts')
      .insert(accountsToInsert)

    if (insertError) {
      console.error('Error inserting accounts:', insertError)
      throw new Error('Failed to store account information')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        accounts_added: accountsToInsert.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in exchange-public-token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})