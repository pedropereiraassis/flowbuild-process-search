import { Client } from '@elastic/elasticsearch'
import { envs } from '@config/envs'

const esClient = new Client({
  node: envs.ELASTICSEARCH_API,
  auth: {
    username: envs.ELASTICSEARCH_USERNAME,
    password: envs.ELASTICSEARCH_PASSWORD,
  },
})

export default esClient
