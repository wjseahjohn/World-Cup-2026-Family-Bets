export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeFlag: string
  awayFlag: string
  date: string        // ISO date string
  group: string       // e.g. "Group B"
  status: 'upcoming' | 'live' | 'finished'
  result?: 'home' | 'draw' | 'away'
  odds: {
    home: number
    draw: number
    away: number
    fetchedAt?: string
  }
}

export interface Bet {
  id: string
  matchId: string
  playerName: string
  pick: 'home' | 'draw' | 'away'
  odds: number        // odds locked at time of bet
  stake: number       // in SGD
  placedAt: string    // ISO timestamp
  settled?: boolean
  payout?: number     // 0 if lost, stake*odds if won
}

export interface Player {
  name: string
  totalStaked: number
  totalPayout: number
  betsPlaced: number
  betsWon: number
}

export interface Tournament {
  id: string
  name: string        // e.g. "Euro 2026"
  adminPin: string    // simple PIN to protect admin actions
  createdAt: string
}
