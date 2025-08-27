import knex, { Knex } from 'knex'
import { envs } from '@src/config/envs'

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: envs.POSTGRES_HOST,
    port: envs.POSTGRES_PORT,
    user: envs.POSTGRES_USER,
    password: envs.POSTGRES_PASSWORD,
    database: envs.POSTGRES_DB,
  },
}

export default knexConfig

export const database = knex(knexConfig)
