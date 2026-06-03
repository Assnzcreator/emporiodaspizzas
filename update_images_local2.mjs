import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const localImgs = {
  'Chocolate': '/images/brigadeiro.png',
  'Brigadeiro': '/images/brigadeiro.png',
  'Chocolate branco': '/images/brigadeiro.png',
  'Borda chocolate': '/images/brigadeiro.png',
  'Borda chocolate branco': '/images/brigadeiro.png',
  'M&M': '/images/brigadeiro.png',
  'Romeu e Julieta': '/images/romeujulieta.png',
  'Coca Cola 1.5L': '/images/coca.png',
  'Coca Cola Zero 1.5L': '/images/coca.png',
  'Guaraná Antártica 1L': '/images/guarana.png',
}

async function updateImages() {
  const { data: products } = await supabase.from('products').select('*')
  
  for (const p of products) {
    let newImage = localImgs[p.name]
    
    if (newImage && p.image !== newImage) {
      await supabase.from('products').update({ image: newImage }).eq('id', p.id)
      console.log(`Updated ${p.name} with local image ${newImage}`)
    }
  }
  console.log("Local images updated successfully!")
}

updateImages()
