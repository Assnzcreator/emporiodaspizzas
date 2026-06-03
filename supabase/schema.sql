-- Tabela de Configurações da Loja
CREATE TABLE IF NOT EXISTS store_settings (
  id integer PRIMARY KEY,
  is_open boolean DEFAULT false,
  opening_time text
);

-- Inserir configuração inicial
INSERT INTO store_settings (id, is_open, opening_time) VALUES (1, true, '18:00') ON CONFLICT DO NOTHING;

-- Tabela de Produtos (Pizzas, Bebidas, etc)
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image text,
  category text,
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  available_days integer[] DEFAULT '{0,1,2,3,4,5,6}'::integer[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Motoboys (Entregadores)
CREATE TABLE IF NOT EXISTS motoboys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_type text NOT NULL,
  delivery_address text,
  payment_method text NOT NULL,
  payment_change numeric,
  total numeric NOT NULL,
  status text DEFAULT 'PENDENTE',
  confirmation_code text,
  motoboy_id uuid REFERENCES motoboys(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  size text,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL
);

-- Desativar RLS para permitir acesso público (já que o app não usa Supabase Auth no momento)
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE motoboys DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Configuração do Realtime para a tabela orders (para os alertas na tela do Admin e Balcão)
alter publication supabase_realtime add table orders;
