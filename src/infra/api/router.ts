import express from 'express'
import {
  searchProcessesElastic,
  searchProcessesPostgres,
  searchProcessesKeyValue,
} from '@src/infra/api/controller'
import {
  validateSearchRequest,
  validateSearchKeyValueRequest,
} from '@src/infra/api/validator'

const router = express.Router()

router.post('/search', validateSearchRequest, searchProcessesElastic)
router.post('/searchPostgres', validateSearchRequest, searchProcessesPostgres)
router.post(
  '/searchKeyValue',
  validateSearchKeyValueRequest,
  searchProcessesKeyValue
)

router.get('/health', (_req, res) => {
  res.status(200).send('OK')
})

export default router
