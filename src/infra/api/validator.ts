import { z } from 'zod'
import type { Request, Response } from 'express'

export function validateSearchRequest(
  req: Request,
  res: Response,
  next: () => void
) {
  const schema = z.object({
    query: z
      .object({
        finalBag: z.string().optional(),
        history: z.string().optional(),
      })
      .refine((data) => data.finalBag || data.history, {
        error: 'At least one of finalBag or history is required',
      }),
    limit: z.number().int().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(parsed.error.issues)
  }

  return next()
}
