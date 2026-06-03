import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const promo = {
  name: 'Combo Quarta-Feira',
  description: '1 pizza G salgada tradicional + 1 pizza G doce + 1 guaraná 1L',
  price: 40.00,
  category: 'promocao',
  image: '/images/promo_quarta.png',
  available: true,
  available_days: [3] // Wednesday
}

async function insertPromo() {
  const { error } = await supabase.from('products').insert([promo])
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Successfully inserted Promoção de Quarta-feira')
  }
}

insertPromo()
