import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const localImgs = [
  { keys: ['coca', 'cola'], url: '/images/coca.png' },
  { keys: ['guaraná', 'guarana'], url: '/images/guarana.png' },
  { keys: ['brigadeiro', 'chocolate'], url: '/images/brigadeiro.png' },
  { keys: ['romeu'], url: '/images/romeujulieta.png' },
]

async function updateImages() {
  const { data: products } = await supabase.from('products').select('*')
  
  for (const p of products) {
    let newImage = null
    
    const match = localImgs.find(item => item.keys.some(k => p.name.toLowerCase().includes(k)))
    if (match) {
      newImage = match.url
    }
    
    if (newImage && p.image !== newImage) {
      await supabase.from('products').update({ image: newImage }).eq('id', p.id)
      console.log(`Updated ${p.name} with local image ${newImage}`)
    }
  }
  console.log("Local images updated successfully!")
}

updateImages()
