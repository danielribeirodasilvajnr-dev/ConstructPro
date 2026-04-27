import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndkshctyncixxbbssfuc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ka3NoY3R5bmNpeHhiYnNzZnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjAxNjIsImV4cCI6MjA5MTIzNjE2Mn0.8_H3EMEl845v-SKgw9eyaPM_FTKhbo199zOgxtxO0t0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  const { data: projects, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }
  
  console.log('--- PROJETOS ---');
  for (const p of projects || []) {
    console.log(`Projeto: ${p.name}`);
    console.log(`Dono (user_id): ${p.user_id}`);
    
    // get profile
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', p.user_id).single();
    console.log(`Email do Dono: ${profile?.email || 'Desconhecido'}`);
    
    // get collaborators
    const { data: collabs } = await supabase.from('project_collaborators').select('*, profiles(email)').eq('project_id', p.id);
    if (collabs && collabs.length > 0) {
      console.log('Colaboradores:');
      collabs.forEach(c => console.log(`  - ${c.profiles?.email} (${c.role})`));
    } else {
      console.log('Colaboradores: Nenhum');
    }
    console.log('----------------');
  }
}

checkProjects();
