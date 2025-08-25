import { logger } from '@src/utils/logger'
import {
  createIndex,
  indexProcess,
} from '@src/infra/elasticsearch/processIndexer'
import { flattenJSONToString } from '@src/utils/flattenJSONToString'
import { ProcessDocument } from '@src/types'
import esClient from '@src/infra/elasticsearch/client'
import { envs } from '@src/config/envs'
import { fetchFinishedProcessesWithExceptions, fetchProcessStatesByProcessId } from '@src/infra/db/flowbuildDataSource'

export async function etl() {
  logger.info('Checking for finished processes...')

  try {
    await createIndex(envs.PROCESSES_INDEX)

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

    const processes = await fetchFinishedProcessesWithExceptions(
      elasticProcessIds
    )

    if (processes?.length > 0) {
      for (const process of processes) {
        const statesResult = await fetchProcessStatesByProcessId(process.id)

        const finalBag = statesResult?.[statesResult?.length - 1]?.bag ?? {}
        const finalResult =
          statesResult?.[statesResult?.length - 1]?.result ?? {}
        const mappedHistory = statesResult.map((state) => {
          return {
            node_id: state.node_id,
            next_node_id: state.next_node_id,
            step_number: state.step_number,
            bag: state.bag,
            result: state.result,
            external_input: state.external_input,
            actor_data: state.actor_data,
            error: state.error,
          }
        })

        const finalBagStr = flattenJSONToString(finalBag)
        const finalResultStr = flattenJSONToString(finalResult)
        const historyStr = flattenJSONToString(mappedHistory)

        const mappedProcess: ProcessDocument = {
          id: process.id,
          workflow_id: process.workflow_id,
          final_status: process.current_status,
          started_at: statesResult?.[0]?.created_at,
          finished_at: statesResult?.[statesResult?.length - 1]?.created_at,
          last_actor_id:
            statesResult?.[statesResult?.length - 1]?.actor_data?.actor_id,
          final_bag: finalBag,
          final_bag_text: finalBagStr,
          final_result_text: finalResultStr,
          final_result: finalResult,
          history: mappedHistory,
          history_text: historyStr,
        }

        await indexProcess(mappedProcess)
      }
    }
  } catch (err) {
    logger.error(`ETL error: ${err}`)
  }
}
