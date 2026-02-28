// Supabase Client Initialization
// This file initializes the Supabase client using environment variables
// Required env variables: SUPABASE_URL, SUPABASE_ANON_KEY

// Create Supabase client instance
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const { createClient } = supabase;

const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Export for use in other files
window.supabaseClient = supabaseClient;
