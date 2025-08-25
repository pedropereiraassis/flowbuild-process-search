import express from 'express'
import { searchProcesses } from './controller'
import { validateSearchRequest } from './validator'

const router = express.Router()

router.post('/search', validateSearchRequest, searchProcesses)

router.get('/health', (_req, res) => {
  res.status(200).send('OK')
})

export default router
