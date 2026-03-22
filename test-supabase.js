// Test Supabase Connection
// Run this in your browser console to test if Supabase is working

async function testSupabaseConnection() {
  try {
    // Import Supabase (if not already available)
    if (typeof window !== 'undefined') {
      const { createClient } = await import('@supabase/supabase-js');
      
      // Use your environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bjuxbgoilihbtnifbihv.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TBSBdDmvnphx26C51b8mGg_wExGcaB5';
      
      console.log('Testing Supabase connection...');
      console.log('URL:', supabaseUrl);
      console.log('Anon Key:', supabaseAnonKey ? 'Provided' : 'Missing');
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test session
      const { data, error } = await supabase.auth.getSession();
      console.log('Session test result:', { data, error });
      
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
      }
      
      console.log('✅ Supabase connection successful!');
      
      // Test if we can query a table
      const { data: slides, error: queryError } = await supabase.from('slides').select('count(*)', { count: 'exact', head: true });
      console.log('Slides count test:', { slides, queryError });
      
      if (queryError) {
        console.warn('⚠️ Table query failed (this might be normal if no auth):', queryError.message);
      }
      
      return true;
      
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
    return false;
  }
}

// Run the test
testSupabaseConnection();