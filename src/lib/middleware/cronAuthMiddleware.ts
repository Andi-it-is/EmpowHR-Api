import { RequestHandler } from "express"

export const cronAuthMiddleware: RequestHandler = (req, res, next) => {
  const token = req.headers['x-cron-secret']
  if (token !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  next()
}