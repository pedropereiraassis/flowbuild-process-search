import cron from 'node-cron'
import { envs } from '@src/config/envs'
import { logger } from '@src/utils/logger'
import { indexFlowBuildProcesses } from '@src/jobs/indexFlowBuildProcesses'
import app from '@src/infra/api/express'
import { createIndex } from '@src/infra/elasticsearch/processIndex'

const PORT: number = parseInt(envs.BACKEND_PORT, 10)

;(async () => {
  await createIndex(envs.PROCESSES_INDEX)

  const task = cron.schedule('* * * * *', indexFlowBuildProcesses, {
    noOverlap: true,
  })
  task.execute()

  app.listen(PORT, () => {
    logger.info(`FlowBuild Process Search app running on port ${PORT} 🚀`)
  })
})()
