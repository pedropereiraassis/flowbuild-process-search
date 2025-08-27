import express from 'express'
import { searchProcesses } from '@src/infra/api/controller'
import { validateSearchRequest } from '@src/infra/api/validator'

const router = express.Router()

router.post('/search', validateSearchRequest, searchProcesses)

router.get('/health', (_req, res) => {
  res.status(200).send('OK')
})

export default router
