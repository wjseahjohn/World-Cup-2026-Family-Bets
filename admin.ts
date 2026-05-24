import type { NextApiRequest, NextApiResponse } from 'next'
import { getMatches, upsertMatch, getTournament, saveTournament } from '@/lib/storage'
import { fetchSGPoolsOdds, fallbackOdds } from '@/lib/sgpools'
import type { Match, Tournament } from '@/lib/types'
import { randomUUID } from 'crypto'

// Simple PIN check — set ADMIN_PIN in Vercel env vars (default: 1234)
function checkPin(pin: string) {
  return pin === (process.env.ADMIN_PIN ?? '1234')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action, pin } = req.body ?? req.query

  if (!checkPin(String(pin))) {
    return res.status(403).json({ error: 'Invalid admin PIN' })
  }

  // ── Setup tournament ────────────────────────────────────────────────────────
  if (action === 'setup_tournament') {
    const t: Tournament = {
      id: randomUUID(),
      name: req.body.name,
      adminPin: String(pin),
      createdAt: new Date().toISOString(),
    }
    await saveTournament(t)
    return res.status(200).json(t)
  }

  // ── Add match ───────────────────────────────────────────────────────────────
  if (action === 'add_match') {
    const { homeTeam, awayTeam, homeFlag, awayFlag, date, group } = req.body

    // Attempt to fetch live odds from SG Pools
    let odds = await fetchSGPoolsOdds(homeTeam, awayTeam)
    if (!odds) odds = fallbackOdds()

    const match: Match = {
      id: randomUUID(),
      homeTeam,
      awayTeam,
      homeFlag: homeFlag ?? '🏳️',
      awayFlag: awayFlag ?? '🏳️',
      date,
      group,
      status: 'upcoming',
      odds,
    }
    await upsertMatch(match)
    return res.status(201).json(match)
  }

  // ── Refresh odds for a match ────────────────────────────────────────────────
  if (action === 'refresh_odds') {
    const { matchId } = req.body
    const matches = await getMatches()
    const match = matches.find(m => m.id === matchId)
    if (!match) return res.status(404).json({ error: 'Match not found' })

    const fresh = await fetchSGPoolsOdds(match.homeTeam, match.awayTeam)
    if (fresh) {
      match.odds = fresh
      await upsertMatch(match)
      return res.status(200).json(match)
    }
    return res.status(200).json({ ...match, oddsRefreshed: false })
  }

  // ── Override odds manually ──────────────────────────────────────────────────
  if (action === 'set_odds') {
    const { matchId, home, draw, away } = req.body
    const matches = await getMatches()
    const match = matches.find(m => m.id === matchId)
    if (!match) return res.status(404).json({ error: 'Match not found' })

    match.odds = {
      home: parseFloat(home),
      draw: parseFloat(draw),
      away: parseFloat(away),
      fetchedAt: new Date().toISOString(),
    }
    await upsertMatch(match)
    return res.status(200).json(match)
  }

  // ── Set match status ────────────────────────────────────────────────────────
  if (action === 'set_status') {
    const { matchId, status } = req.body
    const matches = await getMatches()
    const match = matches.find(m => m.id === matchId)
    if (!match) return res.status(404).json({ error: 'Match not found' })
    match.status = status
    await upsertMatch(match)
    return res.status(200).json(match)
  }

  // ── Set match result ────────────────────────────────────────────────────────
  if (action === 'set_result') {
    const { matchId, result } = req.body
    const matches = await getMatches()
    const match = matches.find(m => m.id === matchId)
    if (!match) return res.status(404).json({ error: 'Match not found' })
    match.result = result
    match.status = 'finished'
    await upsertMatch(match)
    // Leaderboard recalculates on next fetch — no extra work needed
    return res.status(200).json(match)
  }

  return res.status(400).json({ error: 'Unknown action' })
}
