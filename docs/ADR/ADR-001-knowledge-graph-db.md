# ADR-001: Knowledge Graph Database Selection

## Status
Accepted

## Context
The AI Assistant Platform requires a knowledge graph layer to store and traverse richly connected data across User, Document, Event, Pattern, and Decision nodes. The database must support multi-user data isolation, concurrent queries from Node.js and Python services, local Docker development, and a free or near-zero-cost cloud tier for early-stage operation.

## Options Considered

### Neo4j
- **Pros:** Mature native graph engine; Cypher is the de-facto standard graph query language; first-class LangChain/LlamaIndex integrations; official Node.js and Python drivers; trivial Docker Compose setup; permanent free AuraDB cloud tier
- **Cons:** Community Edition is single-instance only; multi-database user isolation requires Enterprise for production at scale; free tier capped at 50,000 nodes / 175,000 relationships
- **Free tier:** AuraDB Free — permanent, no credit card, 50k nodes, 175k relationships

### TigerGraph
- **Pros:** Exceptional bulk-load throughput; highly scalable for large graph ML pipelines
- **Cons:** GSQL is proprietary; steep learning curve; sparse LangChain/LlamaIndex integrations; poor Docker support for local dev
- **Free tier:** $25 credit valid 30 days only — not a persistent free tier

### ArangoDB
- **Pros:** Native multi-model (documents + graphs); open-source Community Edition; AQL is expressive
- **Cons:** Graph traversals simulated via indexes (slower than native graph engines); limited GraphRAG integrations; no persistent free cloud tier (14-day trial only)
- **Free tier:** 14-day trial on ArangoGraph cloud; self-host via Docker indefinitely

## Decision
Neo4j selected. Only option with a permanent free cloud tier, deepest GraphRAG integrations, and Cypher is now an ISO standard (GQL) reducing vendor lock-in risk.

## Consequences
- Start on AuraDB Free; migrate to AuraDB Professional ($65/GB/month) when limits are hit
- Multi-user isolation implemented via per-user label prefixes or property-based filtering at application layer
- 50k node / 175k relationship free-tier cap must be monitored; design data pruning strategy before public launch
- Both Python (`neo4j` driver / LangChain `Neo4jGraph`) and Node.js (`neo4j-driver`) integrations are mature and actively maintained
