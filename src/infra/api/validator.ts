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
        general: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        const definedProps = [data.finalBag, data.history, data.general].filter(
          (val) => val !== undefined
        )

        if (definedProps.length > 1) {
          ctx.addIssue({
            code: "custom",
            message:
              'Only one of finalBag, history, or general must be present.',
          })
        }

        if (definedProps.length === 0) {
          ctx.addIssue({
            code: "custom",
            message:
              'One of finalBag, history, or general must be present.',
          })
        }
      })
      ,
    limit: z.number().int().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(parsed.error.issues)
  }

  return next()
}
