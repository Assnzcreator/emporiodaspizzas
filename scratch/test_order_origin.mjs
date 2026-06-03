import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const { data, error } = await supabase.from('orders').insert([{
    customer_name: 'TEST_ORIGIN',
    total: 0,
    delivery_type: 'TEST_ORIGIN',
    status: 'CANCELADO'
  }]).select();

  if (error) {
    console.log("Error inserting custom delivery_type:", error.message);
  } else {
    console.log("Success! Custom delivery_type allowed.");
    // Cleanup
    await supabase.from('orders').delete().eq('id', data[0].id);
  }
}

testInsert()
