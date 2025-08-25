import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import router from './router'

const app = express()
app.use(express.json())

app.use('/', router)

export default app
