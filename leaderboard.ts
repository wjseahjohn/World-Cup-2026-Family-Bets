import type { NextApiRequest, NextApiResponse } from 'next'
import { getLeaderboard } from '@/lib/storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const leaderboard = await getLeaderboard()
  res.status(200).json(leaderboard)
}
