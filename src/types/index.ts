export interface GenericObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export enum ProcessStatus {
  RUNNING = 'running',
  FINISHED = 'finished',
  ERROR = 'error',
  INTERRUPTED = 'interrupted',
}

export interface Process {
  id: string
  workflow_id: string
  current_status: ProcessStatus
  current_state_id: string
  created_at: string
  blueprint_spec: GenericObject
}

export interface ProcessState {
  id: string
  process_id: string
  step_number: number
  status: ProcessStatus
  node_id: string
  next_node_id: string | null
  engine_id: string
  error: string | null
  time_elapsed: number | null
  created_at: string
  bag: GenericObject
  external_input: GenericObject | null
  result: GenericObject
  actor_data: GenericObject
}

export interface ProcessDocument {
  id: string
  workflow_id?: string
  workflow_name?: string
  workflow_version?: number
  workflow_is_latest?: boolean
  final_status: ProcessStatus
  started_at: string
  finished_at: string

  last_actor_id: string
  final_bag: GenericObject
  final_bag_text: string
  final_result: GenericObject | null
  final_result_text: string

  searchable_text?: string

  history: Array<{
    node_id: string
    next_node_id: string | null
    step_number: number
    bag: GenericObject
    result: GenericObject | null
    external_input: GenericObject | null
    actor_data: GenericObject
    error: string | null
  }>
  history_text: string
}
