import { Process } from '@src/config/types'
import { logger } from '@src/utils/logger'
import {
  fetchKVProcesses,
  fetchFinishedProcessesWithExceptions,
  fetchProcessStatesByProcessId,
  insertKVProcess,
} from '@src/infra/db/flowbuildDataSource'
import { flattenToLeaves } from '@src/utils/flattenToLeaves'
import { normalizeValueToText } from '@src/utils/normalizeValueToText'
import { leafKeyFromPath } from '@src/utils/leafKeyFromPath'

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
    const indexedProcesses = await fetchKVProcesses()

    const processes: Process[] = await fetchFinishedProcessesWithExceptions(
      indexedProcesses.map((p) => p.id)
    )

    if (processes?.length === 0) {
      logger.info('No new finished processes found')
      return
    }

    logger.info(`Found ${processes?.length} finished processes to index`)

    let indexedCount = 0

    for (const process of processes) {
      try {
        logger.info(`Indexing process document ${process.id}`)

        const statesResult = await fetchProcessStatesByProcessId(process.id)

        const map = new Map<
          string,
          {
            key: string
            path: string
            value: string
            process_id: string
            workflow_id: string
            steps: { state_id: string; node_id: string; step_number: number }[]
          }
        >()

        for (const state of statesResult) {
          const buckets = [
            { name: 'bag', obj: state.bag },
            { name: 'result', obj: state.result },
            { name: 'external_input', obj: state.external_input },
          ]

          for (const b of buckets) {
            if (!b.obj) continue

            // flatten to leaf paths with array indices
            const leaves = flattenToLeaves(b.obj, b.name)

            for (const { path, value } of leaves) {
              const key = leafKeyFromPath(path) // e.g., userId
              const value_text = normalizeValueToText(value)

              const stepObj = {
                state_id: state.id || null,
                node_id: state.node_id || null,
                step_number: state.step_number,
              }

              const mapKey = `${process.id}|${path}|${value}`
              if (!map.has(mapKey)) {
                map.set(mapKey, {
                  key,
                  path,
                  value: value_text,
                  process_id: process.id,
                  workflow_id: process.workflow_id,
                  steps: [stepObj],
                })
              } else {
                const entry = map.get(mapKey)!

                if (
                  !entry.steps.some(
                    (s) =>
                      (s.state_id && s.state_id === stepObj.state_id) ||
                      (s.node_id === stepObj.node_id &&
                        s.step_number === stepObj.step_number)
                  )
                ) {
                  entry.steps.push(stepObj)
                }
              }
            }
          }
        }

        logger.info(
          `Indexing ${map.size} key:value entries for process ${process.id}`
        )
        for (const [, doc] of map) {
          await insertKVProcess(doc)
        }

        indexedCount++
        logger.info(
          `Indexed process ${process.id} (${indexedCount}/${processes.length})`
        )
      } catch (err) {
        logger.error(`Error indexing process document ${process.id}`, err)
      }
    }

    logger.info(
      `Finished indexing documents. Indexed processes: ${processes.length}`
    )

    logger.info('✅ indexFlowBuildProcesses job finished')
  } catch (err) {
    logger.error(`❌ indexFlowBuildProcesses job error: ${err}`)
  } finally {
    isRunning = false
  }
}
