import type { Request, Response } from 'express'
import { logger } from '@src/utils/logger'
import { searchProcessesIndex } from '../elasticsearch/searchProcessesIndex'

export async function searchProcesses(req: Request, res: Response) {
  logger.info('Called searchProcesses controller')

  try {
    const { query, limit = 5 } = req.body

    const result = await searchProcessesIndex({
      finalBag: query?.finalBag,
      history: query?.history,
      limit,
    })

   return res.status(200).json(result)
  } catch (error) {
    logger.error('Search error', error)

    return res.status(500).json({ error: 'Internal server error' })
  }
}
