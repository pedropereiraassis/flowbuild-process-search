import { envs } from '@src/config/envs'
import { ProcessDocument, Process, GenericObject } from '@src/config/types'
import { logger } from '@src/utils/logger'
import { mapStatesToHistory } from '@src/utils/processDiff'
// import { flattenJSONToString } from '@src/utils/flattenJSONToString'
import {
  fetchFinishedProcessesWithExceptions,
  fetchProcessStatesByProcessId,
  fetchWorkflow,
} from '@src/infra/db/flowbuildDataSource'
import esClient from '@src/infra/elasticsearch/client'
import { indexProcess } from '@src/infra/elasticsearch/processIndex'

let isRunning = false

export async function indexFlowBuildProcesses() {
  if (isRunning) {
    logger.info('indexFlowBuildProcesses is already running, skipping new run')
    return
  }

  logger.info('🚀 indexFlowBuildProcesses job started')
  isRunning = true

  try {
    logger.info('Checking for finished processes...')
    const elasticProcesses = await esClient.search<ProcessDocument>({
      index: envs.PROCESSES_INDEX,
      size: 10000,
      _source_includes: ['id'],
      query: {
        match_all: {},
      },
    })

    const elasticProcessIds = elasticProcesses.hits.hits
      .map((hit) => hit._source?.id)
      .filter((id) => typeof id === 'string')

    const processes: Process[] = await fetchFinishedProcessesWithExceptions(
      elasticProcessIds
    )

    if (processes?.length === 0) {
      logger.info('No new finished processes found')
      return
    }

    logger.info(`Found ${processes?.length} finished processes to index`)

    const workflowCache: Record<string, GenericObject | undefined> = {}

    // let toIndex: ProcessDocument[] = []
    let builtCount = 0

    // const BULK_INDEX_SIZE = 5

    // logger.info(
    //   `Building ${processes.length} process documents (indexing every ${BULK_INDEX_SIZE} builds)`
    // )

    // let batchCount = 0
    for (const process of processes) {
      try {
        const statesResult = await fetchProcessStatesByProcessId(process.id)

        let workflow = workflowCache[process.workflow_id]
        if (!workflow) {
          workflow = await fetchWorkflow(process.workflow_id)
          workflowCache[process.workflow_id] = workflow
        }

        const finalBag = statesResult?.[statesResult?.length - 1]?.bag ?? {}
        const finalActorData =
          statesResult?.[statesResult?.length - 1]?.actor_data ?? {}
        const history = mapStatesToHistory(statesResult)

        const mappedProcess: ProcessDocument = {
          id: process.id,
          workflow_id: process.workflow_id,
          workflow_name: workflow?.name,
          workflow_version: workflow?.version,
          final_status: process.current_status,
          started_at: statesResult?.[0]?.created_at,
          finished_at: statesResult?.[statesResult?.length - 1]?.created_at,
          final_actor_data: finalActorData,
          final_actor_data_text: JSON.stringify(finalActorData),
          final_bag: finalBag,
          final_bag_text: JSON.stringify(finalBag),
          history: history,
          history_text: JSON.stringify(history),
        }

        await indexProcess(mappedProcess)

        // toIndex.push(mappedProcess)
        builtCount++
        // batchCount++

        // if (batchCount >= BULK_INDEX_SIZE) {
        //   logger.info(
        //     `Built ${builtCount} / ${processes.length} process documents, indexing...`
        //   )
        //   const response = await indexProcessesBulk(toIndex)
        //   logger.info(
        //     `Bulk index response: ${response.succeeded}/${response.attempted} succeeded, ${response.failed} failed`
        //   )

        //   batchCount = 0
        //   toIndex = []
        // }
      } catch (err) {
        logger.error('Error indexing process document', err)
      }
    }

    logger.info(
      `Finished indexing documents. Total indexed: ${builtCount} / ${processes.length}`
    )

    logger.info('✅ indexFlowBuildProcesses job finished')
  } catch (err) {
    logger.error(`❌ indexFlowBuildProcesses job error: ${err}`)
  } finally {
    isRunning = false
  }
}
