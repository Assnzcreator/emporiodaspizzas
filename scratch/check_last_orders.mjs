import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, delivery_type, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Erro ao buscar pedidos:", error.message);
    return;
  }

  console.log("=== ÚLTIMOS 5 PEDIDOS NO BANCO ===");
  data.forEach(o => {
    console.log(`ID: ${o.id.slice(0,5)} | Cliente: ${o.customer_name} | Origem/Tipo: ${o.delivery_type}`);
  });
}

checkOrders()
