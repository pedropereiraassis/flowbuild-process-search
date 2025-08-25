# Flowbuild Search Service
This project demonstrates a viable and scalable approach for searching finished FlowBuild processes using a decoupled service powered by Elasticsearch, NodeJS, and **Elasticsearch's built-in hybrid and semantic search capabilities.**

## How it Works (Elasticsearch Native Hybrid/Semantic Search)

1.  **No Custom ML Setup Required:** Elasticsearch natively supports hybrid and semantic search through its integrated text_embedding and vector query features, eliminating the need for deploying and managing separate ML models.

2.  **Automatic Embedding Generation:** When documents are indexed, Elasticsearch handles the embedding generation internally. You simply send text fields, and Elasticsearch creates vector representations automatically (as per correct mapping).

3.  **Unified Search Pipeline:** You can perform both keyword and semantic search in a single query. Elasticsearch merges traditional inverted index matching with vector-based semantic scoring to return highly relevant results.

4.  **Simplified Querying:** At search time, the Node.js application sends a plain text query. Elasticsearch generates embeddings on-the-fly, runs the hybrid search, and returns ranked results without additional client-side processing.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- FlowBuild Database available and accessible through the connection variables in `.env.development`

### 1. Setup

Add a new network for the flowbuild database on the project's `docker-compose.yaml` file:
```yaml
services:
  postgres:
    ...
    networks:
      - fb-network

...

networks:
  fb-network:
    driver: bridge
```

Run all services:
```bash
docker compose up -d
```

