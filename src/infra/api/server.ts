import cron from 'node-cron'

import app from './express'
import { envs } from '@src/config/envs'
import { etl } from '@src/jobs/etl'
import { logger } from '@src/utils/logger'

const PORT: number = parseInt(envs.BACKEND_PORT, 10)

const task = cron.schedule('* * * * *', etl, { noOverlap: true })
task.execute()

app.listen(PORT, () => {
  logger.info(`FlowBuild Process Search app running on port ${PORT} 🚀`)
})
