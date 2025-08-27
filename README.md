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

### 1. Run Elasticsearch and Kibana with Docker

Run elasticsearch and Kibana services:

```bash
docker compose up -d
```

### 2. Install dependencies and run the service

```bash
npm install
npm run dev
```

### (Optional) Run all with docker:

Add a new network for the flowbuild database on the flowbuild project's `docker-compose.yaml` file:

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

Then uncomment the `app` service and `networks` sections in this project and run all with:

```bash
docker compose up -d
```

## Usage

### ETL Process

A simple cron schedule **(once every minute)** runs an ETL process that extracts finished processes from the FlowBuild database, transforms them (including computing diffs between steps), and loads them into Elasticsearch on `processes` index.

- **Index Mapping:** The index is configured with appropriate mappings to support text, keyword, and vector fields for hybrid search.

- **Configuration:** The project can be configured via environment variables:
  - `LOG_LEVEL`: Logging level (e.g., `info`, `debug`)
  - `CRON_JOB_SCHEDULE`: Cron schedule for the ETL job (default: `* * * * *` for every minute)
  - `POSTGRES_USER`: FlowBuild database user
  - `POSTGRES_PASSWORD`: FlowBuild database password
  - `POSTGRES_DB`: FlowBuild database name
  - `POSTGRES_HOST`: FlowBuild database host
  - `POSTGRES_PORT`: FlowBuild database port
  - `ELASTICSEARCH_API`: Elasticsearch node API URL (e.g., `http://localhost:9200`)
  - `ELASTICSEARCH_USERNAME`: Elasticsearch username
  - `ELASTICSEARCH_PASSWORD`: Elasticsearch password
  - `PROCESSES_INDEX`: Elasticsearch index name for storing processes (default: `processes`)

### Search API

The service exposes a REST API endpoint to perform searches on indexed FlowBuild processes.

- **URL:** `/search`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "query": {
      // Only one of the fields must be provided
      "general": "processes with order number 5" // general search on both history and final bag
      // "history": "search terms here" // search in the processes history (mapped and reduced)
      //"finalBag": "search terms here" // search in the final bag of processes
    },
    "minScore": 0.02, // Optional: minimum score to consider a hit(default: 0.02)
    "limit": 10 // Optional: number of results to return (default: 10)
  }
  ```
- **Response:**
  ```json
    {
      "count": 1,
      "results": [
        {
          "_score": 0.032786883,
          "id": "22181520-833e-11f0-b9b4-872e53f42b3a",
          "workflow_id": "7be513f4-98dc-43e2-8f3a-66e68a61aca8",
          "workflow_name": "pizza1",
          "workflow_version": 1,
          "final_status": "finished",
          "started_at": "2025-08-27T12:05:33.171Z",
          "finished_at": "2025-08-27T12:05:38.666Z",
          ...
        }
      ]
    }
  ```

<details>
<summary>Show full response example</summary>

```json
{
  "count": 1,
  "results": [
    {
      "_score": 0.032786883,
      "id": "22181520-833e-11f0-b9b4-872e53f42b3a",
      "workflow_id": "7be513f4-98dc-43e2-8f3a-66e68a61aca8",
      "workflow_name": "pizza1",
      "workflow_version": 1,
      "final_status": "finished",
      "started_at": "2025-08-27T12:05:33.171Z",
      "finished_at": "2025-08-27T12:05:38.666Z",
      "final_actor_data": {
        "trace": {
          "traceparent": "00-2d4354788acec09833bbc1fb429a8b95-03720daa3984e682-01"
        },
        "claims": [],
        "extData": {
          "exp": 1761694164,
          "iat": 1755694164
        },
        "actor_id": "fcca3ac2d6d14f7db9330b0d77b26558",
        "requestIp": "::ffff:172.23.0.1",
        "userAgent": {
          "os": "unknown",
          "browser": "PostmanRuntime",
          "version": "7.45.0",
          "isMobile": false,
          "platform": "unknown"
        },
        "session_id": "lc_0V125RpedI13KSdV7U"
      },
      "final_bag": {
        "pizzas": {
          "qty": 2,
          "olives": false,
          "flavors": ["mussarela", "pepperoni"]
        },
        "client1": "teste",
        "comment": "check if there are 2 pizzas in the bag",
        "confirm": 5,
        "orderNo": 5
      },
      "history": [
        {
          "node_id": "1",
          "next_node_id": "1",
          "step_number": 1,
          "bag": {},
          "result": {},
          "external_input": {},
          "actor_data": {
            "trace": {
              "traceparent": "00-2d4354788acec09833bbc1fb429a8b95-03720daa3984e682-01"
            },
            "claims": [],
            "extData": {
              "exp": 1761694164,
              "iat": 1755694164
            },
            "actor_id": "fcca3ac2d6d14f7db9330b0d77b26558",
            "requestIp": "::ffff:172.23.0.1",
            "userAgent": {
              "os": "unknown",
              "browser": "PostmanRuntime",
              "version": "7.45.0",
              "isMobile": false,
              "platform": "unknown"
            },
            "session_id": "lc_0V125RpedI13KSdV7U"
          },
          "error": null
        },
        {
          "step_number": 2,
          "node_id": "1",
          "next_node_id": "2",
          "status": "running",
          "error": null,
          "changes": {
            "result.step_number": 2,
            "time_elapsed": "1"
          }
        },
        {
          "step_number": 3,
          "node_id": "2",
          "next_node_id": "3",
          "status": "running",
          "error": null,
          "changes": {
            "bag.pizzas": {
              "qty": 2,
              "olives": false,
              "flavors": ["mussarela", "pepperoni"]
            },
            "bag.client1": "teste",
            "result.step_number": 3,
            "external_input": null,
            "time_elapsed": null
          }
        },
        {
          "step_number": 4,
          "node_id": "3",
          "next_node_id": "4",
          "status": "running",
          "error": null,
          "changes": {
            "bag.orderNo": 5,
            "result.step_number": 4
          }
        },
        {
          "step_number": 5,
          "node_id": "4",
          "next_node_id": "5",
          "status": "pending",
          "error": null,
          "changes": {
            "result.timeout": 5,
            "result.actor_data": {
              "trace": {
                "traceparent": "00-2d4354788acec09833bbc1fb429a8b95-03720daa3984e682-01"
              },
              "claims": [],
              "extData": {
                "exp": 1761694164,
                "iat": 1755694164
              },
              "actor_id": "fcca3ac2d6d14f7db9330b0d77b26558",
              "requestIp": "::ffff:172.23.0.1",
              "userAgent": {
                "os": "unknown",
                "browser": "PostmanRuntime",
                "version": "7.45.0",
                "isMobile": false,
                "platform": "unknown"
              },
              "session_id": "lc_0V125RpedI13KSdV7U"
            },
            "result.process_id": "22181520-833e-11f0-b9b4-872e53f42b3a",
            "result.step_number": 5,
            "time_elapsed": "4"
          }
        },
        {
          "step_number": 6,
          "node_id": "5",
          "next_node_id": "6",
          "status": "running",
          "error": null,
          "changes": {
            "bag.comment": "check if there are 2 pizzas in the bag",
            "result.step_number": 6,
            "time_elapsed": null
          }
        },
        {
          "step_number": 7,
          "node_id": "6",
          "next_node_id": "7",
          "status": "running",
          "error": null,
          "changes": {
            "bag.confirm": 5,
            "result.step_number": 7
          }
        },
        {
          "step_number": 8,
          "node_id": "7",
          "next_node_id": null,
          "status": "finished",
          "error": null,
          "changes": {
            "result.step_number": 8,
            "result.timeout": null,
            "result.actor_data": null,
            "result.process_id": null,
            "time_elapsed": "1"
          }
        }
      ]
    }
  ]
}
```

</details>

## Possible Future Improvements

- **RAG (Retrieval-Augmented Generation):** Integrate a RAG approach where the search service retrieves relevant process documents and feeds them into a language model (like GPT-4) to generate detailed explanations or summaries based on the retrieved data.

- **Enhance ETL Process:** Improve the ETL process to handle larger datasets, incremental updates, and error handling more robustly. Possibly use third-party ETL tools or frameworks like Kafka Connect or Airbyte.

- **Advanced Filtering:** Implement advanced filtering options in the search API to allow users to filter results based on workflow name, status, date ranges, users, etc.

- **Enhanced Indexing:** Explore more sophisticated indexing strategies, such as indexing specific fields separately or using custom analyzers to improve search relevance.

- **User Interface:** Develop a simple web interface or integrate with existing FlowBuild Studio platform to provide users with an easy way to perform searches and view results.


## Demo
<video src="public/demo.mp4" controls width="600">
  Demo video.
</video>