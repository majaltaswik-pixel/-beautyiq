# BeautyIQ Revenue System™ — System Design

## Data Flow

### 1. Product Recommendation Flow
```
User Request → /recommend API → LangGraph Orchestrator
  → Router routes to recommendation module
  → Recommendation Service:
    1. Parse skin profile (type, concerns, allergies)
    2. Query Knowledge Graph for matching products
    3. Query RAG for context
    4. Apply ingredient compatibility rules
    5. Build routine steps
    6. Generate explanation
  → Return { recommendations, routine, reasoning }
```

### 2. Cart Recovery Flow
```
Checkout Abandoned Event → Event Bus → Orchestrator
  → Router detects ABANDONED_CHECKOUT → recovery module
  → Recovery Service:
    1. Get customer info + cart contents
    2. Query Knowledge Graph for alternatives
    3. Build personalized message
    4. Determine channel (email/SMS)
    5. Generate recovery strategy (timing, discount)
  → Return { message, alternatives, strategy }
```

### 3. Upsell Flow
```
Add to Cart Event → Event Bus → Orchestrator
  → Router detects ADD_TO_CART → upsell module
  → Upsell Service:
    1. Parse cart contents
    2. Find complementary products via Knowledge Graph
    3. Detect routine completion gaps
    4. Build bundle with dynamic pricing
  → Return { complementary, bundle, savings }
```

## AI Orchestrator Design

### State Machine
```
                 ┌──────────┐
                 │ Pending  │
                 └────┬─────┘
                      │
                      ▼
                 ┌──────────┐
                 │ Routing  │ ← Router evaluates context
                 └────┬─────┘
                      │
                      ▼
                 ┌──────────┐
                 │ Execute  │ ← Module handler runs
                 └────┬─────┘
                      │
                      ▼
                 ┌──────────┐
                 │ Aggregate│ ← Combine results
                 └────┬─────┘
                      │
                      ▼
                 ┌──────────┐
                 │Completed │
                 └──────────┘
```

### Router Decision Matrix
| Signal | Recommendation | Support | Upsell | Recovery | Content | Analytics |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Skin profile present | ★★★ | ★ | — | — | — | — |
| Product view | ★★★ | — | ★★ | — | — | ★ |
| Add to cart | — | — | ★★★ | — | — | ★ |
| Checkout started | — | — | ★★ | ★ | — | ★ |
| Abandoned checkout | — | — | — | ★★★ | — | — |
| Support query | ★ | ★★★ | — | — | — | — |
| Content request | — | ★ | — | — | ★★★ | — |
| Analytics request | — | — | — | — | — | ★★★ |

## Knowledge Graph Schema

### Node Types
- **Ingredient**: Active compounds (Retinol, Vitamin C, Hyaluronic Acid)
- **SkinType**: Dry, Oily, Combination, Normal, Sensitive
- **SkinConcern**: Acne, Aging, Hyperpigmentation, Dehydration
- **Product**: Shopify products with normalized data
- **Routine**: Ordered sequence of product steps
- **Brand**: Product manufacturers
- **Category**: Product types (Cleanser, Serum, Moisturizer)
- **Benefit**: Desired outcomes (Hydration, Brightening, Anti-aging)

### Edge Types
- CONTAINS: Product → Ingredient
- BENEFITS: Ingredient → SkinConcern
- CONTRAINDICATED: Ingredient → SkinConcern
- TREATS: Product → SkinConcern
- SUITABLE_FOR: Ingredient/Product → SkinType
- STEP_OF: RoutineStep → Routine
- FOLLOWED_BY: RoutineStep → RoutineStep
- COMPATIBLE_WITH: Ingredient ↔ Ingredient
- INCOMPATIBLE_WITH: Ingredient ↔ Ingredient
- SYNERGIZES_WITH: Ingredient ↔ Ingredient
- HAS_BENEFIT: Product/Ingredient → Benefit
- BELONGS_TO: Product → Category

## Database Design

### Key Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| shops | Shopify store connections | myshopify_domain, access_token |
| users | Customer profiles | shopify_customer_id, email |
| products | Synced product catalog | shopify_product_id, price, ingredients |
| ingredients | Ingredient database | name, benefits, contraindications |
| skin_profiles | Customer skin data | skin_type, skin_concerns, allergies |
| events | All platform events | event_type, customer_id, data |
| orders | Purchase records | shopify_order_id, total_price, ai_attributed |
| recommendations | AI recommendation log | module, products, clicked, converted |
| knowledge_graph_nodes | Graph nodes | node_type, label, properties, embedding |
| knowledge_graph_edges | Graph edges | source, target, edge_type, weight |

## Security

### Shopify Integration
- HMAC webhook verification on all incoming webhooks
- OAuth 2.0 token exchange with state parameter validation
- Access tokens stored encrypted in database
- Session management with expiry

### API Security
- Request validation via Shopify App Bridge (JWT)
- Rate limiting per shop
- CORS restricted to Shopify domains
- No direct AI API exposure without authentication

## Performance

### Caching Strategy
- Knowledge Graph nodes cached in memory (LRU)
- Product catalog cached with Redis (TTL: 5min)
- Embedding results cached (TTL: 1hr)
- RAG responses cached per query hash (TTL: 10min)

### Scaling
- Event processing: Horizontal scaling with Redis pub/sub
- Vector search: Pinecone/Weaviate auto-scaling
- Database: pgvector with HNSW indexes
- API: Stateless, horizontally scalable
