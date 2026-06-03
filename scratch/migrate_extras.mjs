import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

const PREDEFINED_EXTRAS = [
  { id: "extra-bacon", name: "Bacon", price: 3.50 },
  { id: "extra-ovo", name: "Ovo", price: 2.00 },
  { id: "extra-queijo", name: "Queijo Mussarela", price: 3.00 },
  { id: "extra-carne", name: "Carne 140g", price: 6.00 },
  { id: "extra-cheddar", name: "Cheddar", price: 4.00 },
];

async function migrateExtras() {
  console.log("Iniciando migração de adicionais...");
  
  const extrasToInsert = PREDEFINED_EXTRAS.map(ex => ({
    name: ex.name,
    description: "Adicional para seu hambúrguer",
    price: ex.price,
    image: "https://images.unsplash.com/photo-1558180069-4fe46a5cc324?w=500&auto=format&fit=crop&q=60",
    category: "adicionais",
    available: true,
    available_days: [0, 1, 2, 3, 4, 5, 6]
  }));

  const { data, error } = await supabase.from('products').insert(extrasToInsert).select();

  if (error) {
    console.error("Erro ao migrar adicionais:", error.message);
  } else {
    console.log(`Sucesso! ${data.length} adicionais migrados.`);
  }
}

migrateExtras()
