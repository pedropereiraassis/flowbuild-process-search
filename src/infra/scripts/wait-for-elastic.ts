import { envs } from '@src/config/envs'

async function checkElaticsearch() {
  const response = await fetch(envs.ELASTICSEARCH_API, {
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(
          envs.ELASTICSEARCH_USERNAME + ':' + envs.ELASTICSEARCH_PASSWORD
        ).toString('base64'),
    },
  })

  if (!response.ok) {
    process.stdout.write('.')
    setTimeout(checkElaticsearch, 2000)
    return
  }

  console.log('\n🟢 Elasticsearch is ready!\n')
}

process.stdout.write('\n\n🔴 Waiting for Elasticsearch')
checkElaticsearch()
