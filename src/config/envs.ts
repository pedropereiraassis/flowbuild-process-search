import dotenv from 'dotenv'
dotenv.config({ path: '.env.development' })

export const envs = {
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  BACKEND_PORT: process.env.BACKEND_PORT ?? '4000',
  CRON_JOB_SCHEDULE: process.env.LOG_LEVEL ?? '* * * * *',
  POSTGRES_USER: process.env.POSTGRES_USER ?? 'postgres',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? 'postgres',
  POSTGRES_DB: process.env.POSTGRES_DB ?? 'workflow',
  POSTGRES_HOST: process.env.POSTGRES_HOST ?? 'localhost',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT ?? '5432'),
  ELASTICSEARCH_API: process.env.ELASTICSEARCH_API ?? 'http://localhost:9200',
  ELASTICSEARCH_USERNAME: process.env.ELASTICSEARCH_USERNAME ?? 'elastic',
  ELASTICSEARCH_PASSWORD: process.env.ELASTICSEARCH_PASSWORD ?? 'elasticsearch',
  PROCESSES_INDEX: process.env.PROCESSES_INDEX ?? 'processes',
}
