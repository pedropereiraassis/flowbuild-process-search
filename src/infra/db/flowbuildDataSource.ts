import { ProcessDocument } from '@src/config/types'
import { database } from '@src/infra/db/knexfile'

export async function initializeDatabase() {
  return await database.raw(`
    CREATE TABLE IF NOT EXISTS kv_process_search (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      path TEXT NOT NULL,
      workflow_id UUID NOT NULL,
      process_id UUID NOT NULL,
      steps JSONB DEFAULT '[]'::jsonb, -- [{ state_id, node_id, step_number }]
      search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(key, '') || ' ' || coalesce(value, '') || ' ' || coalesce(path, ''))
      ) STORED
    );
    
    CREATE INDEX IF NOT EXISTS kv_process_search_workflow_id_idx ON kv_process_search(workflow_id);
    CREATE INDEX IF NOT EXISTS kv_process_search_process_id_idx ON kv_process_search(process_id);
    CREATE INDEX IF NOT EXISTS kv_process_search_key_idx ON kv_process_search(key);
    CREATE INDEX IF NOT EXISTS kv_process_search_path_idx ON kv_process_search(path);
    CREATE INDEX IF NOT EXISTS kv_process_search_value_idx ON kv_process_search ((left(value, 8000)));

    CREATE INDEX IF NOT EXISTS kv_process_search_search_vector_idx ON kv_process_search USING GIN (search_vector);
  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertKVProcess(kvProcess: any) {
  return await database
    .table('kv_process_search')
    .insert({
      key: kvProcess.key,
      value: kvProcess.value,
      path: kvProcess.path,
      workflow_id: kvProcess.workflow_id,
      process_id: kvProcess.process_id,
      steps: JSON.stringify(kvProcess.steps),
    })
    .onConflict('id')
    .merge()
}

export async function insertProcessOnSearchTable(process: ProcessDocument) {
  return await database
    .table('process_search')
    .insert({
      id: process.id,
      workflow_id: process.workflow_id,
      final_status: process.final_status,
      started_at: process.started_at,
      finished_at: process.finished_at,
      final_bag: process.final_bag_text,
      history: process.history_text,
    })
    .onConflict('id')
    .merge()
}

export async function fetchKVProcesses() {
  return await database.table('kv_process_search').distinct('process_id as id')
}

export async function queryKVProcess({
  query,
  limit = 10,
}: {
  query: {
    key?: string
    value?: string
    path?: string
  }
  limit?: number
}) {
  return await database
    .table('kv_process_search')
    .where((builder) => {
      if (query.key) {
        builder.where('key', query.key)
      }
      if (query.value) {
        builder.where('value', query.value)
      }
      if (query.path) {
        builder.where('path', query.path)
      }
    })
    .distinctOn('process_id')
    .select('key', 'value', 'path', 'process_id', 'workflow_id', 'steps')
    .limit(limit)
}

export async function fetchFinishedProcessesOnSearchTable() {
  return await database.table('process_search').distinct('id')
}

export async function queryProcessOnSearchTable({
  query,
  limit = 10,
}: {
  query: string
  limit?: number
}) {
  return await database
    .table('process_search')
    .whereRaw(
      `(final_bag_vector @@ plainto_tsquery('english', ?)) OR (history_vector @@ plainto_tsquery('english', ?))`,
      [query, query]
    )
    .limit(limit)
}

export async function fetchFinishedProcessesWithExceptions(
  exceptionIds: string[]
) {
  return await database
    .table('process')
    .whereIn('current_status', ['finished', 'interrupted', 'error', 'expired'])
    .whereNotIn('id', exceptionIds)
    .orderBy('created_at', 'desc')
}

export async function fetchProcessStatesByProcessId(processId: string) {
  return await database
    .table('process_state')
    .where('process_id', processId)
    .orderBy('created_at', 'asc')
}

export async function fetchWorkflow(id: string) {
  return await database.table('workflow').where('id', id).first()
}
