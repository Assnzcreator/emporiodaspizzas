import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function releaseAllPromos() {
  console.log('Liberando todas as promoções...')
  const { data, error } = await supabase
    .from('products')
    .update({ available_days: [0, 1, 2, 3, 4, 5, 6] })
    .eq('category', 'promocao')
  
  if (error) {
    console.error('Erro ao atualizar:', error)
  } else {
    console.log('Sucesso! Todas as promoções estão visíveis para testes.')
  }
}

releaseAllPromos()
