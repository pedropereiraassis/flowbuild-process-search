/*
Docs for Elasticsearch queries:
https://www.elastic.co/docs/solutions/search/hybrid-semantic-text#hybrid-search-perform-search
https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-bool-query#nested-bool-queries
*/

import { RetrieverContainer } from '@elastic/elasticsearch/lib/api/types'

export interface RetrieverQueryInput {
  finalBag?: string
  history?: string
  general?: string
}

export function buildRetrieverQueries({
  finalBag,
  history,
  general,
}: RetrieverQueryInput) {
  const retrievers: RetrieverContainer[] = [
    { standard: { query: {} } },
    { standard: { query: {} } },
  ]

  if (general) {
    retrievers[0].standard!.query!.bool = {
      should: [
        {
          semantic: {
            field: `final_bag_semantic`,
            query: general,
          },
        },
        {
          semantic: {
            field: `history_semantic`,
            query: general,
          },
        },
      ],
    }

    retrievers[1].standard!.query!.bool = {
      should: [
        {
          match: {
            final_bag_text: general,
          },
        },
        {
          match: {
            history_text: general,
          },
        },
      ],
    }
  }

  if (finalBag) {
    retrievers[0].standard!.query = {
      semantic: {
        field: `final_bag_semantic`,
        query: finalBag,
      },
    }
    retrievers[1].standard!.query = {
      match: {
        final_bag_text: finalBag,
      },
    }
  }

  if (history) {
    retrievers[0].standard!.query = {
      semantic: {
        field: `history_semantic`,
        query: history,
      },
    }
    retrievers[1].standard!.query = {
      match: {
        history_text: history,
      },
    }
  }

  return retrievers
}
