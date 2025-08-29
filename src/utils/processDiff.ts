import _ from 'lodash'
import {
  DiffStep,
  GenericObject,
  HistoryStep,
  ProcessState,
} from '@src/config/types'

export function diffObjects(
  prev: GenericObject,
  curr: GenericObject,
  basePath: string[] = []
): Record<string, GenericObject | null> {
  const diffs: Record<string, GenericObject | null> = {}

  for (const key of Object.keys(curr)) {
    const path = [...basePath, key]
    const pathStr = path.join('.')

    if (!(key in prev)) {
      diffs[pathStr] = curr[key]
    } else if (_.isPlainObject(curr[key]) && _.isPlainObject(prev[key])) {
      Object.assign(diffs, diffObjects(prev[key], curr[key], path))
    } else if (!_.isEqual(curr[key], prev[key])) {
      diffs[pathStr] = curr[key]
    }
  }

  for (const key of Object.keys(prev)) {
    if (!(key in curr)) {
      const path = [...basePath, key].join('.')
      diffs[path] = null // convention: null means removed
    }
  }

  return diffs
}

export function mapStatesToHistory(
  states: ProcessState[]
): (HistoryStep | DiffStep)[] {
  const newHistory: (HistoryStep | DiffStep)[] = []

  for (let i = 0; i < states.length; i++) {
    const step = states[i]

    if (i === 0) {
      // First step: keep full data
      newHistory.push({
        node_id: step.node_id,
        next_node_id: step.next_node_id,
        step_number: step.step_number,
        bag: step.bag,
        result: step.result,
        external_input: step.external_input,
        actor_data: step.actor_data,
        error: step.error,
      })
    } else {
      const prev = states[i - 1]
      const diffs = diffObjects(
        {
          bag: prev.bag,
          result: prev.result,
          external_input: prev.external_input,
          actor_data: prev.actor_data,
          error: prev.error,
          time_elapsed: prev.time_elapsed,
        },
        {
          bag: step.bag,
          result: step.result,
          external_input: step.external_input,
          actor_data: step.actor_data,
          error: step.error,
          time_elapsed: step.time_elapsed,
        }
      )

      newHistory.push({
        step_number: step.step_number,
        node_id: step.node_id,
        next_node_id: step.next_node_id,
        status: step.status,
        error: step.error,
        changes: diffs,
      })
    }
  }

  return newHistory
}
