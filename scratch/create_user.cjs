const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'juninho7_rsj@hotmail.com',
      password: 'senhaTemporaria123!',
      email_confirm: true,
      user_metadata: { full_name: 'Juninho' }
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }

    console.log('User created successfully:', data.user.id);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createUser();
