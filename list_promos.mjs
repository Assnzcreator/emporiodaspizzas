import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function listPromos() {
  const { data } = await supabase.from('products').select('name, category').eq('category', 'promocao')
  console.log('Promos in DB:')
  data.forEach(p => console.log(`"${p.name}"`))
}

listPromos()
