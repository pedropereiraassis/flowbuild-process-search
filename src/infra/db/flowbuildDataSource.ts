import { database } from './knexfile'

export async function fetchFinishedProcessesWithExceptions(
  exceptionIds: string[]
) {
  return await database
    .table('process')
    .whereIn('current_status', ['finished', 'interrupted'])
    .whereNotIn('id', exceptionIds)
    .orderBy('created_at', 'desc')
}

export async function fetchProcessStatesByProcessId(processId: string) {
  return await database
    .table('process_state')
    .where('process_id', processId)
    .orderBy('created_at', 'asc')
}
