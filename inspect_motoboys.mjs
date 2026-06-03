import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStructure() {
  const { data: motoboys, error: mError } = await supabase.from('motoboys').select('*').limit(1);
  console.log('Motoboys Columns:', motoboys ? Object.keys(motoboys[0] || {}) : 'Empty/Error');
  
  const { data: orders, error: oError } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders Columns:', orders ? Object.keys(orders[0] || {}) : 'Empty/Error');
}

checkStructure()
