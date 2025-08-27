import { logger } from '@src/utils/logger'
import { indexProcess } from '@src/infra/elasticsearch/processIndex'
// import { flattenJSONToString } from '@src/utils/flattenJSONToString'
import { ProcessDocument } from '@src/types'
import esClient from '@src/infra/elasticsearch/client'
import { envs } from '@src/config/envs'
import {
  fetchFinishedProcessesWithExceptions,
  fetchProcessStatesByProcessId,
  fetchWorkflow,
} from '@src/infra/db/flowbuildDataSource'
import { mapStatesToHistory } from '@src/utils/processDiff'

export async function indexFlowBuildProcesses() {
  logger.info('Checking for finished processes...')

  try {
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

    if (processes?.length === 0) {
      logger.info('No new finished processes found')
      return
    }

    logger.info(`Found ${processes?.length} finished processes to index`)
    for (const process of processes) {
      const [statesResult, workflow] = await Promise.all([
        fetchProcessStatesByProcessId(process.id),
        fetchWorkflow(process.workflow_id),
      ])

      const finalBag = statesResult?.[statesResult?.length - 1]?.bag ?? {}
      const finalActorData =
        statesResult?.[statesResult?.length - 1]?.actor_data ?? {}
      const history = mapStatesToHistory(statesResult)

      // Using JSON.stringify for now cause it showed better results than flattening, but we can revisit this later
      // const finalBagStr = flattenJSONToString(finalBag)
      // const finalActorDataStr = flattenJSONToString(finalActorData)
      // const historyStr = flattenJSONToString(history)

      const finalBagStr = JSON.stringify(finalBag)
      const finalActorDataStr = JSON.stringify(finalActorData)
      const historyStr = JSON.stringify(history)

      const mappedProcess: ProcessDocument = {
        id: process.id,
        workflow_id: process.workflow_id,
        workflow_name: workflow?.name,
        workflow_version: workflow?.version,
        final_status: process.current_status,
        started_at: statesResult?.[0]?.created_at,
        finished_at: statesResult?.[statesResult?.length - 1]?.created_at,
        final_actor_data: finalActorData,
        final_actor_data_text: finalActorDataStr,
        final_bag: finalBag,
        final_bag_text: finalBagStr,
        history: history,
        history_text: historyStr,
      }

      await indexProcess(mappedProcess)
    }

    logger.info('Finished indexing processes')
  } catch (err) {
    logger.error(`indexFlowBuildProcesses error: ${err}`)
  }
}
