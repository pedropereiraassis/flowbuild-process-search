import { envs } from '@src/config/envs'
import { ProcessDocument } from '@src/config/types'
import { logger } from '@src/utils/logger'
import esClient from '@src/infra/elasticsearch/client'

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
          final_status: { type: 'keyword' },
          started_at: { type: 'date' },
          finished_at: { type: 'date' },
          final_actor_data: { type: 'flattened' },
          final_actor_data_text: {
            type: 'text',
            copy_to: 'final_actor_data_semantic',
          },
          final_actor_data_semantic: { type: 'semantic_text' },
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

  logger.info(`Index [${index}] already exists`)
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
    logger.error(`Indexing process error: ${processDocument.id} - `, err)
  }
}
