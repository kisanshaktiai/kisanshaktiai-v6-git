
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const jwtSecret = Deno.env.get('JWT_SECRET') || 'your-jwt-secret'

async function getDefaultTenant() {
  try {
    console.log('Fetching default tenant from tenant-default endpoint');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/tenant-default`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch default tenant:', response.status, response.statusText);
      return null;
    }

    const tenantData = await response.json();
    console.log('Default tenant fetched successfully:', tenantData);
    
    return {
      id: tenantData.id,
      name: tenantData.name
    };
  } catch (error) {
    console.error('Error fetching default tenant:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mobile_number, pin, farmer_data = {} } = await req.json()

    console.log('=== REGISTRATION START ===')
    console.log('Registration request received:', { 
      mobile_number, 
      hasPin: !!pin, 
      farmer_data,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!mobile_number || !pin) {
      console.error('Missing required fields:', { mobile_number: !!mobile_number, pin: !!pin })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number and PIN are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean mobile number (remove any non-digits)
    const cleanMobile = mobile_number.replace(/\D/g, '')
    console.log('Cleaned mobile number:', cleanMobile)
    
    if (cleanMobile.length !== 10) {
      console.error('Invalid mobile number length:', cleanMobile.length)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please enter a valid 10-digit mobile number' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate PIN is exactly 4 digits
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      console.error('Invalid PIN format:', { length: pin.length, isNumeric: /^\d{4}$/.test(pin) })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PIN must be exactly 4 digits' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get default tenant dynamically
    const defaultTenant = await getDefaultTenant()
    
    if (!defaultTenant || !defaultTenant.id) {
      console.error('No default tenant available')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'System configuration error. Please contact support.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Using tenant:', defaultTenant)

    // Use provided tenant_id or the resolved one
    const finalTenantId = farmer_data.tenant_id || defaultTenant.id

    // Check if farmer already exists with this mobile number and tenant
    console.log('Checking for existing farmer...')
    const { data: existingFarmer, error: existingError } = await supabase
      .from('farmers')
      .select('id, mobile_number, tenant_id')
      .eq('mobile_number', cleanMobile)
      .eq('tenant_id', finalTenantId)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing farmer:', existingError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error checking existing farmer registration' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingFarmer) {
      console.log('Farmer already exists:', existingFarmer)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'A farmer with this mobile number already exists' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash the PIN using Web Crypto API
    console.log('Hashing PIN...')
    const encoder = new TextEncoder()
    const salt = 'kisan_shakti_pin_salt_2024'
    const data = encoder.encode(pin + salt + cleanMobile)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Generate unique farmer code
    const timestamp = Date.now().toString(36)
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    const farmerCode = `F${cleanMobile.substring(6)}_${timestamp}_${randomSuffix}`

    // Generate a UUID for the farmer
    const farmerId = crypto.randomUUID()

    console.log('Generated farmer details:', {
      farmerId,
      farmerCode,
      tenantId: finalTenantId,
      pinHashLength: pinHash.length
    })

    // Begin transaction for atomic operations
    try {
      // Prepare farmer data with all required fields
      const farmerInsertData = {
        id: farmerId,
        mobile_number: cleanMobile,
        pin_hash: pinHash,
        farmer_code: farmerCode,
        tenant_id: finalTenantId,
        app_install_date: new Date().toISOString().split('T')[0],
        login_attempts: 0,
        is_verified: false,
        farming_experience_years: farmer_data.farming_experience_years || null,
        farm_type: farmer_data.farm_type || null,
        total_land_acres: farmer_data.total_land_acres || null,
        primary_crops: farmer_data.primary_crops || null,
        annual_income_range: farmer_data.annual_income_range || null,
        has_loan: farmer_data.has_loan || false,
        loan_amount: farmer_data.loan_amount || null,
        has_tractor: farmer_data.has_tractor || false,
        has_irrigation: farmer_data.has_irrigation || false,
        irrigation_type: farmer_data.irrigation_type || null,
        has_storage: farmer_data.has_storage || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Inserting farmer data...')

      // Create farmer record first
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .insert([farmerInsertData])
        .select()
        .single()

      if (farmerError) {
        console.error('Farmer creation error:', farmerError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Registration failed: ' + (farmerError.message || 'Unknown error') 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Farmer created successfully:', farmerData)

      // Now create user profile with the same ID as farmer
      const userProfileData = {
        id: farmerId, // Use same ID as farmer
        mobile_number: cleanMobile,
        phone_verified: true,
        preferred_language: farmer_data.preferred_language || 'hi',
        full_name: farmer_data.full_name || farmerCode,
        farmer_id: farmerId, // Reference to farmer
        tenant_id: finalTenantId, // Add tenant_id for consistency
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating user profile...')

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert(userProfileData)
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        
        // Critical: Clean up the farmer record if profile creation fails
        console.log('Cleaning up farmer record due to profile creation failure...')
        await supabase
          .from('farmers')
          .delete()
          .eq('id', farmerId)
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Registration failed: Unable to create user profile' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User profile created successfully:', profileData)

      // Generate JWT token
      const jwt = await import('https://deno.land/x/djwt@v3.0.1/mod.ts')
      
      const payload = {
        farmer_id: farmerData.id,
        tenant_id: farmerData.tenant_id,
        mobile_number: farmerData.mobile_number,
        farmer_code: farmerData.farmer_code,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }

      const token = await jwt.create(
        { alg: 'HS256', typ: 'JWT' },
        payload,
        jwtSecret
      )

      console.log('=== REGISTRATION SUCCESS ===')
      console.log('Registration completed successfully:', {
        farmerId: farmerData.id,
        farmerCode: farmerData.farmer_code,
        mobile: farmerData.mobile_number,
        tenantId: farmerData.tenant_id,
        profileId: profileData.id,
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          token,
          farmer: {
            id: farmerData.id,
            farmer_code: farmerData.farmer_code,
            mobile_number: farmerData.mobile_number,
            tenant_id: farmerData.tenant_id
          },
          user_profile: {
            id: profileData.id,
            mobile_number: profileData.mobile_number,
            preferred_language: profileData.preferred_language,
            full_name: profileData.full_name,
            farmer_id: profileData.farmer_id
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Registration transaction failed: ' + (transactionError.message || 'Unknown error') 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===')
    console.error('Registration error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + (error.message || 'Unknown error') 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
