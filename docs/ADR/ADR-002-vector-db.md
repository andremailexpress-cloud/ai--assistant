# ADR-002: Vector Database Selection

## Status
Accepted

## Context
The platform uses RAG with Gemini Flash 1.5 over user-owned content. Embeddings must be stored per-user with strict isolation. Expected scale starts below 100k vectors per user. PostgreSQL is already provisioned. Budget is constrained at development stage.

## Options Considered

### pgvector
- **Pros:** Zero additional infrastructure; reuses existing PostgreSQL; full SQL joins between vector results and relational data; HNSW + IVFFlat indexes; multi-tenant isolation via `WHERE user_id = $1`; open source
- **Cons:** Memory-intensive HNSW index builds at scale; degrades beyond 10-20M vectors without partitioning; no native hybrid search; resource contention with OLTP traffic
- **Cost:** Free

### Pinecone
- **Pros:** Fully managed; native namespace multi-tenancy; serverless scaling; consistent low latency
- **Cons:** $50/month minimum; vendor lock-in; metadata filtering multiplies cost 5-10x; no SQL joins
- **Cost:** Free Starter (2GB, 1 region); $50+/month Standard

### Weaviate
- **Pros:** Best hybrid search (vector + BM25); native multi-tenant collections; open source
- **Cons:** Adds an operational service; $45/month managed cloud; GraphQL unfamiliar to SQL teams
- **Cost:** Self-hosted free; $45+/month cloud

### Milvus
- **Pros:** Billion-scale architecture; high throughput
- **Cons:** Operationally complex (etcd, MinIO, Pulsar required); Node.js client immature; overkill for current scale
- **Cost:** Self-hosted free but high infrastructure TCO; $99+/month managed

## Decision
pgvector selected. Zero incremental cost, already inside PostgreSQL, adequate for current scale. Revisit when total vectors approach 50M or hybrid search becomes a core requirement. Migration target at that point: Weaviate self-hosted.

## Consequences
- No new infrastructure service at launch
- Per-user isolation must be enforced via `user_id` pre-filtering on every ANN query — reviewed in all PRs
- Hybrid (vector + BM25) search not available without additional tooling
- Schema and embedding logic must not hard-code pgvector constructs beyond the repository layer to keep migration path clean
- HNSW index creation must run as background maintenance, not inline with user requests
