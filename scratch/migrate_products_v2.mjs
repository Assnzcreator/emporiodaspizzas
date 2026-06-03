import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cleznwcfnstkafodyuvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZXpud2NmbnN0a2Fmb2R5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDI1MTMsImV4cCI6MjA5MzE3ODUxM30.rmJD7VTJQcQPJBFNb46MBWHxpICfzKDmpnd83jZ8sCU'
const supabase = createClient(supabaseUrl, supabaseKey)

const burgers = [
  { id: "x-salada", name: "X-Salada", description: "1 Carne 140g, salada, molho especial e mussarela.", price: 14.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", category: "classicos" },
  { id: "x-bacon", name: "X-Bacon", description: "1 carne 140g, bacon crocante, salada e molho especial.", price: 14.99, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=80", category: "classicos" },
  { id: "x-mussarela-duplo", name: "X-Mussarela Duplo", description: "2 carnes 120g, muita mussarela, salada e molho especial.", price: 14.99, image: "https://images.unsplash.com/photo-1525164286253-04e68b9d94bb?w=800&q=80", category: "classicos" },
  { id: "x-bacon-duplo", name: "X-Bacon Duplo", description: "Carne, molho barbecue, queijo cheddar, bacon e cebolas caramelizadas.", price: 14.99, image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80", category: "classicos" },
  { id: "x-duplo-cheddar", name: "X-Duplo Cheddar", description: "2 carnes, mussarela, cheddar, salada e molho especial.", price: 14.99, image: "https://images.unsplash.com/photo-1534790563855-6c7d96429b82?w=800&q=80", category: "classicos" },
  { id: "x-barbecue", name: "X-Barbecue", description: "1 carne 140g, bacon, molho especial barbecue e salada.", price: 14.99, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80", category: "classicos" },
  { id: "x-costela-cheddar", name: "X-Costela Cheddar", description: "1 carne 120g + 70g de costela desfiada, cheddar barbecue e cebola caramelizada.", price: 14.99, image: "https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?w=800&q=80", category: "artesanais" },
  { id: "x-costela-queijo-coalho", name: "X-Costela Queijo Coalho", description: "1 carne 120g + 70g de costela desfiada, queijo coalho, barbecue e cebola caramelizada.", price: 14.99, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80", category: "artesanais" },
  { id: "x-costela-mussarela", name: "X-Costela Mussarela", description: "1 carne 120g + 70g de costela desfiada, mussarela, barbecue e cebola caramelizada.", price: 14.99, image: "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=800&q=80", category: "artesanais" },
  { id: "x-costela-cream-cheese", name: "X-Costela Cream Cheese", description: "1 carne 120g + 70g de costela desfiada, cream cheese, barbecue e cebola caramelizada.", price: 14.99, image: "https://images.unsplash.com/photo-1607013271323-820c00383006?w=800&q=80", category: "artesanais" },
  { id: "x-fraldinha", name: "X-Fraldinha", description: "1 carne 120g + 70g de fraldinha desfiada, cheddar barbecue e cebola caramelizada.", price: 18.00, image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80", category: "premium" },
  { id: "x-fraldinha-cream-cheese", name: "X-Fraldinha Cream Cheese", description: "1 carne 120g + 70g de fraldinha desfiada, cream cheese, barbecue e cebola caramelizada.", price: 18.00, image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80", category: "premium" },
  { id: "x-especial-emporio", name: "X-Especial Empório", description: "2 Carnes 140g, bacon em fatias, ovo, cheddar, mussarela, salada e molho secreto.", price: 24.90, image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80", category: "premium" },
  { id: "x-picanha-prime", name: "X-Picanha Prime", description: "Hambúrguer de picanha 160g, queijo prato, cebola crispy e maionese de ervas.", price: 22.00, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", category: "premium" },
  { id: "x-monster-burguer", name: "X-Monster Burguer", description: "3 Carnes 120g, 3 camadas de queijo, bacon duplo e muito molho barbecue.", price: 29.90, image: "https://images.unsplash.com/photo-1534790563855-6c7d96429b82?w=800&q=80", category: "premium" },
  { id: "batata-frita", name: "Batata Frita G", description: "Batatas crocantes with sal e maionese da casa.", price: 18.90, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80", category: "acompanhamentos" },
  { id: "coca-cola-350", name: "Coca-Cola Lata", description: "Refrigerante 350ml bem gelado.", price: 6.00, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80", category: "bebidas" },
  { id: "h2o", name: "H2O 500ml", description: "Refrigerante cítrico levemente gaseificado de limão.", price: 7.00, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80", category: "bebidas" },
  { id: "coca-1-5l", name: "Coca-Cola 1,5L", description: "Refrigerante 1,5 litros para compartilhar.", price: 12.00, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80", category: "bebidas" },
  { id: "guarana-1l", name: "Guaraná Antarctica 1L", description: "Refrigerante Guaraná Antarctica 1 Litro original.", price: 8.00, image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=800&q=80", category: "bebidas" },
  { id: "coca-vidro-ks", name: "Coca-Cola Vidro KS", description: "Refrigerante original em garrafa de vidro (clássica).", price: 10.00, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80", category: "bebidas" },
  { id: "agua-sem-gas", name: "Água sem Gás", description: "Água mineral natural 500ml.", price: 2.00, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80", category: "bebidas" },
  { id: "cerveja-heineken", name: "Cerveja Heineken Lata", description: "Cerveja Heineken 350ml bem gelada.", price: 9.00, image: "https://images.unsplash.com/photo-1618885472118-20c279d70b09?w=800&q=80", category: "bebidas" }
];

async function migrate() {
  const { data: dbProducts, error: fetchError } = await supabase.from('products').select('name');
  if (fetchError) return console.error('Fetch error:', fetchError);

  const dbNames = new Set(dbProducts.map(p => p.name));
  const toInsert = burgers.filter(b => !dbNames.has(b.name)).map(b => ({
    name: b.name,
    description: b.description,
    price: b.price,
    image: b.image,
    category: b.category,
    available: true,
    available_days: [0, 1, 2, 3, 4, 5, 6]
  }));

  if (toInsert.length === 0) {
    console.log('All items are already in the database.');
    return;
  }

  console.log(`Inserting ${toInsert.length} new items...`);
  const { data, error } = await supabase.from('products').insert(toInsert).select();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Migration successful!', data.length, 'items inserted.');
  }
}

migrate();
