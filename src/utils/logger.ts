import { createLogger, transports, format } from 'winston'
import { envs } from '@src/config/envs'

export const logger = createLogger({
  level: envs.LOG_LEVEL,
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
    )
  ),
  transports: [new transports.Console()],
  exceptionHandlers: [new transports.Console({ format: format.errors() })],
  rejectionHandlers: [new transports.Console()],
})
