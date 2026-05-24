/**
 * Storage helpers.
 * In production (Vercel) uses @vercel/kv (Redis-backed).
 * In local dev, falls back to an in-memory store so you don't
 * need to configure KV locally.
 */

import type { Match, Bet, Tournament } from './types'

// ─── In-memory fallback (dev / environments without KV) ──────────────────────
const memStore: Record<string, string> = {}

async function kvGet(key: string): Promise<string | null> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    return kv.get<string>(key)
  }
  return memStore[key] ?? null
}

async function kvSet(key: string, value: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, value)
  } else {
    memStore[key] = value
  }
}

// ─── Tournament ───────────────────────────────────────────────────────────────

export async function getTournament(): Promise<Tournament | null> {
  const raw = await kvGet('tournament')
  return raw ? JSON.parse(raw) : null
}

export async function saveTournament(t: Tournament): Promise<void> {
  await kvSet('tournament', JSON.stringify(t))
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function getMatches(): Promise<Match[]> {
  const raw = await kvGet('matches')
  return raw ? JSON.parse(raw) : []
}

export async function saveMatches(matches: Match[]): Promise<void> {
  await kvSet('matches', JSON.stringify(matches))
}

export async function getMatch(id: string): Promise<Match | null> {
  const matches = await getMatches()
  return matches.find(m => m.id === id) ?? null
}

export async function upsertMatch(match: Match): Promise<void> {
  const matches = await getMatches()
  const idx = matches.findIndex(m => m.id === match.id)
  if (idx >= 0) matches[idx] = match
  else matches.push(match)
  await saveMatches(matches)
}

// ─── Bets ─────────────────────────────────────────────────────────────────────

export async function getBets(): Promise<Bet[]> {
  const raw = await kvGet('bets')
  return raw ? JSON.parse(raw) : []
}

export async function saveBets(bets: Bet[]): Promise<void> {
  await kvSet('bets', JSON.stringify(bets))
}

export async function addBets(newBets: Bet[]): Promise<void> {
  const existing = await getBets()
  await saveBets([...existing, ...newBets])
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard() {
  const [bets, matches] = await Promise.all([getBets(), getMatches()])

  const finishedMatchIds = new Set(
    matches.filter(m => m.status === 'finished').map(m => m.id)
  )

  const players: Record<string, {
    name: string
    totalStaked: number
    totalPayout: number
    betsPlaced: number
    betsWon: number
    pendingBets: number
  }> = {}

  for (const bet of bets) {
    if (!players[bet.playerName]) {
      players[bet.playerName] = {
        name: bet.playerName,
        totalStaked: 0,
        totalPayout: 0,
        betsPlaced: 0,
        betsWon: 0,
        pendingBets: 0,
      }
    }
    const p = players[bet.playerName]
    p.betsPlaced++

    if (finishedMatchIds.has(bet.matchId)) {
      const match = matches.find(m => m.id === bet.matchId)
      p.totalStaked += bet.stake
      if (match?.result === bet.pick) {
        const payout = bet.stake * bet.odds
        p.totalPayout += payout
        p.betsWon++
      }
    } else {
      p.pendingBets++
    }
  }

  return Object.values(players).sort(
    (a, b) => (b.totalPayout - b.totalStaked) - (a.totalPayout - a.totalStaked)
  )
}
