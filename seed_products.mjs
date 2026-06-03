import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const envs = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => line.split('=').map(str => str.trim().replace(/^"|"$/g, '')))
)

const supabaseUrl = envs.VITE_SUPABASE_URL
const supabaseKey = envs.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const products = [
  // Tradicionais (20.00)
  { name: 'Frango', description: 'molho, frango, mussarela e cebola', price: 20, category: 'classicos' },
  { name: 'Especial de frango', description: 'molho, frango e mussarela', price: 20, category: 'classicos' },
  { name: 'Frango catupiry', description: 'molho, frango, mussarela e catupiry', price: 20, category: 'classicos' },
  { name: 'Frango cheddar', description: 'molho, frango, mussarela e cheddar', price: 20, category: 'classicos' },
  { name: 'Frango cream cheese', description: 'molho, frango, mussarela e cream cheese', price: 20, category: 'classicos' },
  { name: 'Frango bacon', description: 'molho, frango, mussarela, bacon e cebola', price: 20, category: 'classicos' },
  { name: 'Frango caipira', description: 'molho, frango, mussarela, catupiry e milho', price: 20, category: 'classicos' },
  { name: 'Frango misto', description: 'molho, frango, presunto, mussarela e milho', price: 20, category: 'classicos' },
  { name: 'Bacon', description: 'molho, bacon, mussarela e cebola', price: 20, category: 'classicos' },
  { name: 'Calabresa', description: 'molho, mussarela, calabresa e cebola', price: 20, category: 'classicos' },
  { name: 'Calabresa catupiry', description: 'molho, mussarela, calabresa e catupiry', price: 20, category: 'classicos' },
  { name: 'Calabresa cheddar', description: 'molho, calabresa, mussarela e cheddar', price: 20, category: 'classicos' },
  { name: 'Calabresa cream cheese', description: 'molho, mussarela, calabresa e cream cheese', price: 20, category: 'classicos' },
  { name: 'Calabresa barbecue', description: 'molho, calabresa, mussarela e barbecue', price: 20, category: 'classicos' },
  { name: '2 queijos', description: 'molho, mussarela e catupiry', price: 20, category: 'classicos' },
  { name: '4 queijos', description: 'molho, mussarela, catupiry, cheddar e parmesão', price: 20, category: 'classicos' },
  { name: 'Mussarela', description: 'molho e mussarela', price: 20, category: 'classicos' },
  { name: 'Americana', description: 'molho, bacon, mussarela e ovo', price: 20, category: 'classicos' },

  // Especiais (25.00)
  { name: 'Queijo reino', description: 'molho, mussarela e queijo do reino', price: 25, category: 'artesanais' },
  { name: 'Carne de sol', description: 'molho, mussarela, carne de sol e catupiry', price: 25, category: 'artesanais' },
  { name: 'Carne de sol cream cheese', description: 'molho, mussarela, carne de sol e cream cheese', price: 25, category: 'artesanais' },
  { name: 'Charque', description: 'molho, mussarela, charque e catupiry', price: 25, category: 'artesanais' },
  { name: 'Charque cream cheese', description: 'charque, mussarela, molho e cream cheese', price: 25, category: 'artesanais' },
  { name: 'Lombo', description: 'molho, mussarela, lombo e catupiry', price: 25, category: 'artesanais' },
  { name: 'Atum', description: 'molho, mussarela, atum', price: 25, category: 'artesanais' },
  { name: 'Carioca', description: 'atum, calabresa, mussarela, molho e cebola', price: 25, category: 'artesanais' },

  // Especial Camarão (30.00)
  { name: 'Camarão', description: 'molho, mussarela e camarão', price: 30, category: 'artesanais' },
  { name: 'Camarão catupiry', description: 'molho, mussarela, camarão e catupiry', price: 30, category: 'artesanais' },
  { name: 'Camarão cheese', description: 'molho, mussarela, camarão e cream cheese', price: 30, category: 'artesanais' },
  { name: 'Camarão cheddar', description: 'molho, camarão, mussarela e cheddar', price: 30, category: 'artesanais' },

  // Doces (20.00)
  { name: 'Chocolate', description: 'Pizza doce de chocolate', price: 20, category: 'premium' },
  { name: 'Brigadeiro', description: 'Pizza doce de brigadeiro', price: 20, category: 'premium' },
  { name: 'Chocolate branco', description: 'Pizza doce de chocolate branco', price: 20, category: 'premium' },
  { name: 'Romeu e Julieta', description: 'Pizza doce de queijo com goiabada', price: 20, category: 'premium' },
  { name: 'M&M', description: 'Pizza doce com M&M', price: 20, category: 'premium' },

  // Adicionais Bordas Doces (7.00)
  { name: 'Borda doce de leite', description: 'Borda recheada doce', price: 7, category: 'adicionais' },
  { name: 'Borda chocolate', description: 'Borda recheada doce', price: 7, category: 'adicionais' },
  { name: 'Borda chocolate branco', description: 'Borda recheada doce', price: 7, category: 'adicionais' },
  { name: 'Borda creme de avelã', description: 'Borda recheada doce', price: 7, category: 'adicionais' },

  // Bebidas
  { name: 'Guaraná Antártica 1L', description: 'Bebida', price: 8, category: 'bebidas' },
  { name: 'Coca Cola 1.5L', description: 'Bebida', price: 12, category: 'bebidas' },
  { name: 'Coca Cola Zero 1.5L', description: 'Bebida', price: 12, category: 'bebidas' },
  { name: 'Água com gás 250ml', description: 'Bebida', price: 3, category: 'bebidas' },
  { name: 'Água 250ml', description: 'Bebida', price: 2, category: 'bebidas' },
  { name: 'H2O', description: 'Bebida', price: 7, category: 'bebidas' },

  // Promoção Segunda-feira - Borda Grátis
  { name: 'Borda de Cheddar (PROMO Segunda)', description: 'Borda grátis promocional', price: 0, category: 'promocao', available_days: [1] },
  { name: 'Borda de Catupiry (PROMO Segunda)', description: 'Borda grátis promocional', price: 0, category: 'promocao', available_days: [1] },
]

async function seed() {
  console.log('Iniciando o seeding de produtos no banco de dados...')
  
  const formattedProducts = products.map(p => ({
    ...p,
    image: p.category === 'bebidas' 
      ? 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop',
    available: true,
  }))

  const { data, error } = await supabase.from('products').insert(formattedProducts)
  if (error) {
    console.error('Erro ao inserir:', error)
  } else {
    console.log(`Sucesso! ${products.length} produtos inseridos com sucesso.`)
  }
}

seed()
