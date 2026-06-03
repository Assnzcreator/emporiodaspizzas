import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Map of keywords to image URLs
const imgMap = [
  // Bebidas
  { keys: ['coca', 'cola'], url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop' },
  { keys: ['guaraná', 'guarana'], url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&auto=format&fit=crop' },
  { keys: ['água', 'agua', 'h2o'], url: 'https://images.unsplash.com/photo-1546820389-44d77e1f3b31?w=800&auto=format&fit=crop' },
  
  // Doces
  { keys: ['chocolate'], url: 'https://images.unsplash.com/photo-1589187151053-5ec8818e661b?w=800&auto=format&fit=crop' },
  { keys: ['brigadeiro', 'm&m'], url: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=800&auto=format&fit=crop' }, 
  { keys: ['romeu'], url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&auto=format&fit=crop' }, 

  // Camarão
  { keys: ['camarão', 'camarao'], url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop' },

  // Carnes
  { keys: ['carne', 'charque', 'lombo', 'carioca'], url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop' }, 
  
  // Frango
  { keys: ['frango'], url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop' },

  // Calabresa
  { keys: ['calabresa'], url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop' },

  // Bacon
  { keys: ['bacon', 'americana'], url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop' },

  // Queijos
  { keys: ['queijo', 'mussarela', 'reino'], url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop' },

  // Atum
  { keys: ['atum'], url: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=800&auto=format&fit=crop' },
]

const fallbackImage = "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&auto=format&fit=crop"

async function updateImages() {
  const { data: products } = await supabase.from('products').select('*')
  
  for (const p of products) {
    let newImage = fallbackImage
    
    // Find first matching keyword
    const match = imgMap.find(item => item.keys.some(k => p.name.toLowerCase().includes(k)))
    if (match) {
      newImage = match.url
    } else if (p.category === 'adicionais' || p.category === 'promocao') {
      newImage = "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&auto=format&fit=crop"
    }

    if (p.image !== newImage) {
      await supabase.from('products').update({ image: newImage }).eq('id', p.id)
      console.log(`Updated ${p.name} with specific image`)
    }
  }
  console.log("Images updated successfully!")
}

updateImages()
