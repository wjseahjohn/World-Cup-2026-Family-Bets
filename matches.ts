import type { NextApiRequest, NextApiResponse } from 'next'
import { getMatches } from '@/lib/storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const matches = await getMatches()
  res.status(200).json(matches)
}
