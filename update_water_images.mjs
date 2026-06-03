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
  'Água com gás 250ml': '/images/h2o.png',
  'H2O': '/images/h2o.png',
  'Água 250ml': '/images/agua.png',
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
  console.log("Local water images updated successfully!")
}

updateImages()
