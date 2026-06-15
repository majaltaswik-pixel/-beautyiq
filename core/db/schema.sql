-- BeautyIQ Revenue System™ - PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users / Shops
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  myshopify_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope VARCHAR(512),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uninstalled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  shopify_customer_id BIGINT UNIQUE,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  tags TEXT[],
  note TEXT,
  total_spent DECIMAL(12,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  shopify_product_id BIGINT UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  product_type VARCHAR(200),
  vendor VARCHAR(200),
  collections TEXT[] DEFAULT '{}',
  price DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]',
  options JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_shopify_id ON products(shopify_product_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_ingredients ON products USING GIN(ingredients);

-- Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  benefits TEXT[] DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}',
  suitable_skin_types TEXT[] DEFAULT '{}',
  safety_level VARCHAR(20) DEFAULT 'safe',
  concentration_max DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  concentration DECIMAL(5,2),
  role VARCHAR(100),
  UNIQUE(product_id, ingredient_id)
);

-- Skin Profiles
CREATE TABLE IF NOT EXISTS skin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shopify_customer_id BIGINT,
  skin_type VARCHAR(20) CHECK (skin_type IN ('dry','oily','combination','normal','sensitive')),
  skin_concerns TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  preferences TEXT[] DEFAULT '{}',
  current_routine TEXT[] DEFAULT '{}',
  age INTEGER,
  region VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  entity VARCHAR(50),
  entity_id VARCHAR(100),
  customer_id VARCHAR(100),
  session_id VARCHAR(100),
  source VARCHAR(50) DEFAULT 'shopify',
  data JSONB,
  raw JSONB,
  enriched_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_customer ON events(customer_id);
CREATE INDEX idx_events_created ON events(created_at DESC);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  shopify_cart_id VARCHAR(100),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shopify_customer_id BIGINT,
  token VARCHAR(100),
  line_items JSONB DEFAULT '[]',
  total_price DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  abandoned_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  shopify_order_id BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shopify_customer_id BIGINT,
  email VARCHAR(255),
  total_price DECIMAL(12,2),
  subtotal_price DECIMAL(12,2),
  total_discounts DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  financial_status VARCHAR(50),
  fulfillment_status VARCHAR(50),
  line_items JSONB DEFAULT '[]',
  ai_attributed BOOLEAN DEFAULT FALSE,
  attribution_module VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX idx_orders_ai_attributed ON orders(ai_attributed);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shopify_customer_id BIGINT,
  session_id VARCHAR(100),
  module VARCHAR(50) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  products JSONB DEFAULT '[]',
  clicked BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,
  click_timestamp TIMESTAMP WITH TIME ZONE,
  conversion_timestamp TIMESTAMP WITH TIME ZONE,
  revenue DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shopify_customer_id BIGINT,
  session_id VARCHAR(100),
  module VARCHAR(50),
  messages JSONB DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Graph
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id VARCHAR(200) PRIMARY KEY,
  node_type VARCHAR(50) NOT NULL,
  label VARCHAR(500) NOT NULL,
  properties JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kg_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX idx_kg_nodes_label ON knowledge_graph_nodes USING GIN(label gin_trgm_ops);

CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id VARCHAR(200) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_id VARCHAR(200) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(50) NOT NULL,
  weight DECIMAL(5,2) DEFAULT 1.0,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, edge_type, target_id)
);

CREATE INDEX idx_kg_edges_source ON knowledge_graph_edges(source_id);
CREATE INDEX idx_kg_edges_target ON knowledge_graph_edges(target_id);
CREATE INDEX idx_kg_edges_type ON knowledge_graph_edges(edge_type);
