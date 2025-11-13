import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started...')
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('Request body parsed:', { user_id: requestBody?.user_id ? 'present' : 'missing' })
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { user_id } = requestBody

    if (!user_id) {
      console.log('Missing user_id')
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User ID received:', user_id)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL present:', !!supabaseUrl)
    console.log('Supabase Key present:', !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client created')

    // Plaid configuration
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'

    console.log('Checking Plaid credentials...')
    console.log('PLAID_CLIENT_ID present:', !!plaidClientId)
    console.log('PLAID_SECRET present:', !!plaidSecret)
    console.log('PLAID_ENV:', plaidEnv)

    if (!plaidClientId || !plaidSecret) {
      console.error('Plaid credentials not configured')
      
      return new Response(
        JSON.stringify({ 
          error: 'Plaid credentials not configured',
          details: {
            clientId: !!plaidClientId,
            secret: !!plaidSecret,
            env: plaidEnv
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('All credentials present, creating Plaid link token...')

    // For now, return success to test if we get this far
    return new Response(
      JSON.stringify({ 
        link_token: 'test-token',
        message: 'Test - all credentials are present',
        debug: {
          clientId: !!plaidClientId,
          secret: !!plaidSecret,
          env: plaidEnv
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in initiate-bank-connection:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})