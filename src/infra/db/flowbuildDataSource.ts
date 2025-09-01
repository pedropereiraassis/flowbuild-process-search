import { ProcessDocument } from '@src/config/types'
import { database } from '@src/infra/db/knexfile'

export async function initializeDatabase() {
  return await database.raw(`
    CREATE TABLE IF NOT EXISTS process_search (
      id UUID PRIMARY KEY,
      workflow_id UUID NOT NULL,
      final_status VARCHAR(50) NOT NULL,
      started_at TIMESTAMP WITH TIME ZONE NOT NULL,
      finished_at TIMESTAMP WITH TIME ZONE,
      final_bag JSONB,
      history JSONB,
      final_bag_vector tsvector GENERATED ALWAYS AS (
        jsonb_to_tsvector('english', final_bag, '["all"]')
      ) STORED,
      history_vector tsvector GENERATED ALWAYS AS (
        jsonb_to_tsvector('english', history, '["all"]')
      ) STORED
    );
    
    CREATE INDEX IF NOT EXISTS process_search_final_bag_vector_idx ON process_search USING GIN (final_bag_vector);
    CREATE INDEX IF NOT EXISTS process_search_history_vector_idx ON process_search USING GIN (history_vector);
  `)
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

export async function fetchFinishedProcessesOnSearchTable() {
  return await database.table('process_search').select('id')
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
