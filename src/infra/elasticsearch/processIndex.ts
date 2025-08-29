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
          // final_actor_data_semantic: { type: 'semantic_text' },
          final_bag: { type: 'flattened' },
          final_bag_text: { type: 'text', copy_to: 'final_bag_semantic' },
          // final_bag_semantic: { type: 'semantic_text' },
          history: { type: 'flattened' },
          history_text: { type: 'text', copy_to: 'history_semantic' },
          // history_semantic: { type: 'semantic_text' },
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
    })

    logger.info(`Indexed process: ${processDocument.id}`)
  } catch (err) {
    logger.error(`Indexing process error: ${processDocument.id} - `, err)
  }
}

export interface BulkIndexResult {
  attempted: number
  succeeded: number
  failed: number
}

export async function indexProcessesBulk(
  processDocuments: ProcessDocument[]
): Promise<BulkIndexResult> {
  const result: BulkIndexResult = { attempted: 0, succeeded: 0, failed: 0 }

  if (!processDocuments || processDocuments.length === 0) return result

  const body: ({ index: { _index: string; _id: string } } | ProcessDocument)[] =
    []

  for (const doc of processDocuments) {
    body.push({ index: { _index: envs.PROCESSES_INDEX, _id: doc.id } })
    body.push(doc)
  }

  result.attempted += processDocuments.length

  try {
    const resp = await esClient.bulk<ProcessDocument>({
      refresh: false,
      operations: body,
    })

    if (resp.errors) {
      let failed = 0
      let succeeded = 0

      for (const item of resp.items) {
        const op = Object.values(item)[0]
        if (op && op.error) failed += 1
        else succeeded += 1
      }

      result.failed += failed
      result.succeeded += succeeded

      logger.error('Bulk indexing had errors', { failed, succeeded })
    } else {
      result.succeeded += processDocuments.length

      logger.info(`Bulk indexed ${processDocuments.length} processes`)
    }
  } catch (err) {
    result.failed += processDocuments.length

    logger.error('Bulk indexing error', err)
  }

  try {
    await esClient.indices.refresh({ index: envs.PROCESSES_INDEX })
  } catch (err) {
    logger.warn('Failed to refresh index after bulk operations', err)
  }

  return result
}
