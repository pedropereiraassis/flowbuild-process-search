import { envs } from '@src/config/envs'
import { ProcessDocument } from '@src/config/types'
import { HITS_MIN_SCORE, HITS_THRESHOLD } from '@src/config/constants'
import { logger } from '@src/utils/logger'
import esClient from '@src/infra/elasticsearch/client'
import {
  buildQuery,
  // buildRetrieverQueries
} from '@src/infra/elasticsearch/queryBuilder'

export interface SearchQueryInput {
  query: {
    finalBag?: string
    history?: string
    general?: string
  }
  limit?: number
  minScore?: number
  threshold?: number
}

export async function searchProcessesIndex({
  query,
  limit = 10,
  minScore = HITS_MIN_SCORE,
  threshold = HITS_THRESHOLD,
}: SearchQueryInput) {
  const { finalBag, history, general } = query

  // const retrievers = buildRetrieverQueries({
  //   finalBag,
  //   history,
  //   general,
  // })

  const esQuery = buildQuery({
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
    query: esQuery,
    // retriever: {
    //   rrf: {
    //     retrievers,
    //     rank_window_size: 20,
    //   },
    // },
  }

  try {
    logger.verbose('Executing search on processes index', searchParams)

    const result = await esClient.search<ProcessDocument>(searchParams)

    const topScore =
      result.hits?.max_score || result.hits?.hits?.[0]?._score || 0

    const cutoff = topScore * threshold

    const hits = (result.hits?.hits || [])
      .filter(
        (hit) => hit._score && hit._score >= minScore && hit._score >= cutoff
      )
      .map((hit) => {
        const source = {
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
