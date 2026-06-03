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
  name: 'Combo Sábado',
  description: '2 pizzas G sabores tradicionais + uma coca 1.5L (Um sabor por pizza)',
  price: 50.00,
  category: 'promocao',
  image: '/images/promo_sabado.png',
  available: true,
  available_days: [6] // Saturday (6)
}

async function insertPromo() {
  const { error } = await supabase.from('products').insert([promo])
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Successfully inserted Promoção de Sábado')
  }
}

insertPromo()
