import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testTables() {
  const tables = ['extras', 'product_extras', 'additional_items'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (!error) {
      console.log(`Table ${t} exists!`);
    } else {
      console.log(`Table ${t} error:`, error.message);
    }
  }
}

testTables()
