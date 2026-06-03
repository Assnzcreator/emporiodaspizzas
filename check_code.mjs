import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLatestOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, confirmation_code, customer_name')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro ao buscar pedido:', error);
  } else {
    console.log('Último pedido:', data[0]);
  }
}

checkLatestOrder();
