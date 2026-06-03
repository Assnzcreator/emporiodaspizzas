import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hsdxojqfqnzvobqzofsr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZHhvanFmcW56dm9icXpvZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Njg5MzcsImV4cCI6MjA5NTI0NDkzN30.ZVX2nrEEi_W0_MXjfTDp5bNgLzhuN6yp-9XvYELaMyQ";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .update({ image: '/images/promo_borda.png' })
    .eq('category', 'promocao')
    .ilike('name', '%Borda%');

  if (error) {
    console.error('Erro ao atualizar:', error);
  } else {
    console.log('Imagens atualizadas com sucesso:', data);
  }
}

main();
