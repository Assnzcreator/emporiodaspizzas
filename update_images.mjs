import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const images = {
  coca: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop",
  guarana: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&auto=format&fit=crop", // Green soda / generic
  agua: "https://images.unsplash.com/photo-1546820389-44d77e1f3b31?w=800&auto=format&fit=crop", // Water bottle
  doce: "https://images.unsplash.com/photo-1589187151053-5ec8818e661b?w=800&auto=format&fit=crop", // Chocolate pizza
  especial: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop", // Gourmet pizza
  classica: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop", // Classic pizza
  borda: "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&auto=format&fit=crop" // Bread/crust
}

async function updateImages() {
  const { data: products } = await supabase.from('products').select('*')
  
  for (const p of products) {
    let newImage = images.classica
    
    if (p.category === 'bebidas') {
      if (p.name.toLowerCase().includes('coca')) newImage = images.coca
      else if (p.name.toLowerCase().includes('guaran')) newImage = images.guarana
      else newImage = images.agua
    } else if (p.category === 'premium') { // Doces
      newImage = images.doce
    } else if (p.category === 'artesanais') { // Especiais
      newImage = images.especial
    } else if (p.category === 'adicionais' || p.category === 'promocao') { // Bordas
      newImage = images.borda
    }
    
    if (p.image !== newImage) {
      await supabase.from('products').update({ image: newImage }).eq('id', p.id)
      console.log(`Updated ${p.name} image`)
    }
  }
  console.log("Images updated successfully!")
}

updateImages()
