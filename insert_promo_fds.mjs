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
  name: 'Combo Sexta e Domingo',
  description: '2 pizzas G sabores tradicionais + 1 antártica 1L (Um sabor por pizza)',
  price: 45.00,
  category: 'promocao',
  image: '/images/promo_fds.png',
  available: true,
  available_days: [0, 5] // Sunday (0) and Friday (5)
}

async function insertPromo() {
  const { error } = await supabase.from('products').insert([promo])
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Successfully inserted Promoção de Sexta e Domingo')
  }
}

insertPromo()
