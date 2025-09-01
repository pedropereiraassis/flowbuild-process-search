import type { Request, Response } from 'express'
import { HITS_MIN_SCORE, HITS_THRESHOLD } from '@src/config/constants'
import { logger } from '@src/utils/logger'
import { searchProcessesIndex } from '@src/infra/elasticsearch/searchProcessesIndex'
import { queryProcessOnSearchTable } from '../db/flowbuildDataSource'

export async function searchProcessesElastic(req: Request, res: Response) {
  logger.info('Called searchProcessesElastic controller')

  try {
    const { query, minScore, limit } = req.body

    const results = await searchProcessesIndex({
      query,
      limit,
      minScore: minScore ?? HITS_MIN_SCORE,
      threshold: HITS_THRESHOLD,
    })

    return res.status(200).json({
      count: results.length,
      results,
    })
  } catch (error) {
    logger.error('searchProcessesElastic error', error)

    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function searchProcessesPostgres(req: Request, res: Response) {
  logger.info('Called searchProcessesPostgres controller')

  try {
    const { query, limit } = req.body

    const results = await queryProcessOnSearchTable({
      query: query?.general ?? '',
      limit,
    })

    return res.status(200).json({
      count: results.length,
      results,
    })
  } catch (error) {
    logger.error('searchProcessesPostgres error', error)

    return res.status(500).json({ error: 'Internal server error' })
  }
}
