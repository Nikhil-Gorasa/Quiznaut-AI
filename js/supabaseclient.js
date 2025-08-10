// Supabase client initializer for static hosting

if (!window.supabase) {
  console.error('Supabase JS library not loaded. Ensure CDN script is included before this file.');
}

// Debug logging for configuration
console.log('Supabase client initialization:', {
  supabaseLibrary: window.supabase ? '✓ Loaded' : '✗ Missing',
  supabaseUrl: window.SUPABASE_URL ? '✓ Loaded' : '✗ Missing',
  supabaseKey: window.SUPABASE_ANON_KEY ? '✓ Loaded' : '✗ Missing'
});

export const supabase = window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

export const supabaseClient = supabase;

// Debug logging for client creation
if (supabase) {
  console.log('✓ Supabase client created successfully');
} else {
  console.error('✗ Failed to create Supabase client');
}


