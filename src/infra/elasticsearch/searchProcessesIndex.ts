import { envs } from '@src/config/envs'
import { logger } from '@src/utils/logger'
import { ProcessDocument } from '@src/types'
import esClient from '@src/infra/elasticsearch/client'
import { buildRetrieverQueries } from '@src/infra/elasticsearch/queryBuilder'

export interface SearchQueryInput {
  query: {
    finalBag?: string
    history?: string
    general?: string
  }
  limit?: number
}

export async function searchProcessesIndex(input: SearchQueryInput) {
  const {
    query: { finalBag, history, general },
    limit = 10,
  } = input

  const retrievers = buildRetrieverQueries({
    finalBag,
    history,
    general,
  })

  const searchParams = {
    index: envs.PROCESSES_INDEX,
    size: limit,
    _source_excludes: [
      'final_bag_text',
      'final_actor_data_text',
      'history_text',
    ],
    retriever: {
      rrf: {
        retrievers,
        rank_window_size: 20,
      },
    },
  }

  try {
    logger.verbose('Executing search on processes index', searchParams)

    const result = await esClient.search<ProcessDocument>(searchParams)

    const topScore =
      result.hits?.max_score || result.hits?.hits?.[0]?._score || 0

    const cutoff = topScore * 0.8 // We can adjust this threshold as needed

    const hits = (result.hits?.hits || [])
      .filter((hit) => hit._score && hit._score >= cutoff)
      .map((hit) => {
        const source  = {
          _score: hit._score,
          ...hit._source,
        }
        return source
      })

    return hits
  } catch (err) {
    logger.error('Error searching processes in Elasticsearch', err)
    throw err
  }
}
