import type { Request, Response } from 'express'
import { HITS_MIN_SCORE, HITS_THRESHOLD } from '@src/config/constants'
import { logger } from '@src/utils/logger'
import { searchProcessesIndex } from '@src/infra/elasticsearch/searchProcessesIndex'

export async function searchProcesses(req: Request, res: Response) {
  logger.info('Called searchProcesses controller')

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
    logger.error('Search error', error)

    return res.status(500).json({ error: 'Internal server error' })
  }
}
