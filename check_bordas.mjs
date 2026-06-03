import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data } = await supabase.from('products').select('*')
  const bordas = data.filter(p => p.category === 'adicionais' || p.name.toLowerCase().includes('borda'))
  console.log('Bordas encontradas:', bordas)
}

check()
