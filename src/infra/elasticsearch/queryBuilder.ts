/*
Docs for Elasticsearch queries:
https://www.elastic.co/docs/solutions/search/hybrid-semantic-text#hybrid-search-perform-search
https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-bool-query#nested-bool-queries
*/

import {
  QueryDslQueryContainer,
  RetrieverContainer,
} from '@elastic/elasticsearch/lib/api/types'

export interface RetrieverQueryInput {
  finalBag?: string
  history?: string
}

export function buildRetrieverQueries({
  finalBag,
  history,
}: RetrieverQueryInput) {
  const retrievers: RetrieverContainer[] = [
    { standard: { query: { bool: { must: [] } } } },
    { standard: { query: { bool: { must: [] } } } },
  ]

  const add = (fieldBase: string, value: string) => {
    ;(
      retrievers[0].standard!.query!.bool!.must! as QueryDslQueryContainer[]
    ).push({
      match: { [`${fieldBase}_text`]: value },
    })
    ;(retrievers[1].standard!.query!.bool!
      .must as QueryDslQueryContainer[])!.push({
      semantic: { field: `${fieldBase}_semantic`, query: value },
    })
  }

  if (finalBag) {
    add('final_bag', finalBag)
  }
  if (history) {
    add('history', history)
  }

  return retrievers
}
