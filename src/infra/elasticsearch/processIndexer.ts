import { envs } from '@config/envs'
import esClient from './client'
import { logger } from '../../utils/logger'
import { ProcessDocument } from '@src/types'

export async function createIndex(index: string) {
  const exists = await esClient.indices.exists({ index: index })

  if (!exists) {
    await esClient.indices.create({
      index: index,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          workflow_id: { type: 'keyword' },
          workflow_name: { type: 'keyword' },
          workflow_version: { type: 'keyword' },
          workflow_is_latest: { type: 'boolean' },
          final_status: { type: 'keyword' },
          started_at: { type: 'date' },
          finished_at: { type: 'date' },
          last_actor_id: { type: 'keyword' },
          searchable_text: { type: 'text' },
          final_result: { type: 'flattened' },
          final_result_text: { type: 'text', copy_to: 'final_result_semantic' },
          final_result_semantic: { type: 'semantic_text' },
          final_bag: { type: 'flattened' },
          final_bag_text: { type: 'text', copy_to: 'final_bag_semantic' },
          final_bag_semantic: { type: 'semantic_text' },
          history: { type: 'flattened' },
          history_text: { type: 'text', copy_to: 'history_semantic' },
          history_semantic: { type: 'semantic_text' },
        },
      },
    })
    logger.info(`Created index [${index}]`)
  }
}

export async function indexProcess(processDocument: ProcessDocument) {
  logger.verbose('Indexing process', processDocument.id)

  try {
    await esClient.index({
      index: envs.PROCESSES_INDEX,
      id: processDocument.id,
      document: processDocument,
      refresh: true,
    })

    logger.info(`Indexed process: ${processDocument.id}`)
  } catch (err) {
    logger.error('Indexing error', err)
  }
}
