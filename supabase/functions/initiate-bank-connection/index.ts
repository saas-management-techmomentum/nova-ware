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
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json()
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
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }


    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

    // Plaid configuration
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'

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

  } catch (error: unknown) {
    console.error('Error in initiate-bank-connection:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        stack: errorStack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})