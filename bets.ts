import type { NextApiRequest, NextApiResponse } from 'next'
import { addBets, getMatch } from '@/lib/storage'
import type { Bet } from '@/lib/types'
import { randomUUID } from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { playerName, bets } = req.body as {
    playerName: string
    bets: Array<{
      matchId: string
      pick: 'home' | 'draw' | 'away'
      stake: number
    }>
  }

  if (!playerName?.trim()) return res.status(400).json({ error: 'Player name required' })
  if (!Array.isArray(bets) || bets.length === 0) return res.status(400).json({ error: 'No bets provided' })

  const newBets: Bet[] = []
  for (const b of bets) {
    const match = await getMatch(b.matchId)
    if (!match) return res.status(400).json({ error: `Match ${b.matchId} not found` })
    if (match.status === 'finished') return res.status(400).json({ error: `Match ${match.homeTeam} vs ${match.awayTeam} already finished` })
    if (b.stake < 1) return res.status(400).json({ error: 'Minimum stake is $1' })

    const odds =
      b.pick === 'home' ? match.odds.home :
      b.pick === 'draw' ? match.odds.draw :
      match.odds.away

    newBets.push({
      id: randomUUID(),
      matchId: b.matchId,
      playerName: playerName.trim(),
      pick: b.pick,
      odds,
      stake: b.stake,
      placedAt: new Date().toISOString(),
      settled: false,
    })
  }

  await addBets(newBets)
  res.status(201).json({ success: true, betsPlaced: newBets.length })
}
