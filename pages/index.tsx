import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import type { Match, Bet } from '@/lib/types'

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  tabs: {
    display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0',
    marginBottom: 24,
  },
  tab: {
    padding: '10px 20px', fontSize: 14, cursor: 'pointer',
    border: 'none', background: 'none', color: '#888',
    borderBottom: '2px solid transparent', marginBottom: -1,
    fontWeight: 500,
  },
  tabActive: { color: '#1a1a1a', borderBottomColor: '#1a1a1a' },
  card: {
    background: '#fff', borderRadius: 12, border: '1px solid #ebebeb',
    padding: '16px 20px', marginBottom: 12,
  },
  matchTeams: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  matchMeta: { fontSize: 12, color: '#888', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' },
  oddsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 },
  oddsBtn: {
    padding: '10px 8px', border: '1px solid #e8e8e8', borderRadius: 8,
    cursor: 'pointer', background: '#fafafa', textAlign: 'center' as const,
    transition: 'all 0.15s',
  },
  oddsBtnSelected: {
    background: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8',
  },
  oddsLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  oddsVal: { fontSize: 17, fontWeight: 700 },
  stakeRow: { display: 'flex', alignItems: 'center', gap: 10 },
  stakeLabel: { fontSize: 13, color: '#666', whiteSpace: 'nowrap' as const },
  stakeInput: {
    flex: 1, padding: '7px 10px', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: 14, outline: 'none',
  },
  potential: { fontSize: 13, color: '#16a34a', fontWeight: 600, minWidth: 80, textAlign: 'right' as const },
  nameInput: {
    width: '100%', padding: '10px 14px', fontSize: 15,
    border: '1px solid #e0e0e0', borderRadius: 10, marginBottom: 16,
    outline: 'none',
  },
  submitBtn: {
    width: '100%', padding: '13px', border: '1px solid #e0e0e0',
    borderRadius: 10, cursor: 'pointer', background: '#fff',
    fontSize: 15, fontWeight: 600, marginTop: 8,
    transition: 'background 0.15s',
  },
  submitBtnPrimary: {
    background: '#1a1a1a', color: '#fff', border: '1px solid #1a1a1a',
  },
  badge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 6,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
  },
  lbTable: { width: '100%', borderCollapse: 'collapse' as const },
  lbTh: {
    fontSize: 11, color: '#888', fontWeight: 500, textAlign: 'left' as const,
    padding: '8px 12px', borderBottom: '1px solid #ebebeb',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  },
  lbTd: { padding: '12px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #ebebeb', padding: '12px 14px', textAlign: 'center' as const },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: 700 },
  adminInput: {
    width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: 14, marginBottom: 8, outline: 'none',
  },
  row: { display: 'flex', gap: 8, marginBottom: 8 },
  toast: {
    position: 'fixed' as const, bottom: 24, left: '50%',
    transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff',
    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
    zIndex: 99, whiteSpace: 'nowrap' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  divider: { height: 1, background: '#f0f0f0', margin: '16px 0' },
  adminSmall: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.5 },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusBadge = (status: Match['status']) => {
  const map = {
    upcoming: { bg: '#f3f4f6', color: '#6b7280', label: 'Upcoming' },
    live:     { bg: '#fef2f2', color: '#dc2626', label: '● Live' },
    finished: { bg: '#f0fdf4', color: '#16a34a', label: 'Finished' },
  }
  const b = map[status]
  return (
    <span style={{ ...s.badge, background: b.bg, color: b.color }}>{b.label}</span>
  )
}

const rankEmoji = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`

// ─── Types ───────────────────────────────────────────────────────────────────

interface Selection {
  pick: 'home' | 'draw' | 'away'
  odds: number
  stake: number
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState<'bet' | 'leaderboard' | 'admin'>('bet')
  const [matches, setMatches] = useState<Match[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [playerName, setPlayerName] = useState('')
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Admin state
  const [adminPin, setAdminPin] = useState('')
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [newMatch, setNewMatch] = useState({
    homeTeam: '', awayTeam: '', homeFlag: '', awayFlag: '',
    date: '', group: '',
  })
  const [manualOdds, setManualOdds] = useState<Record<string, { home: string, draw: string, away: string }>>({})

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const loadMatches = useCallback(async () => {
    const res = await fetch('/api/matches')
    const data = await res.json()
    setMatches(data)
  }, [])

  const loadLeaderboard = useCallback(async () => {
    const res = await fetch('/api/leaderboard')
    const data = await res.json()
    setLeaderboard(data)
  }, [])

  useEffect(() => {
    loadMatches()
    loadLeaderboard()
    // refresh matches every 5 min
    const t = setInterval(loadMatches, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [loadMatches, loadLeaderboard])

  // ── Bet submission ──────────────────────────────────────────────────────────
  const submitBets = async () => {
    if (!playerName.trim()) { showToast('Enter your name first!'); return }
    const bets = Object.entries(selections)
      .filter(([, sel]) => sel.stake > 0)
      .map(([matchId, sel]) => ({ matchId, pick: sel.pick, stake: sel.stake }))
    if (bets.length === 0) { showToast('Place at least one bet!'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim(), bets }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`✓ ${data.betsPlaced} bet${data.betsPlaced > 1 ? 's' : ''} submitted! Good luck ${playerName.trim()}!`)
        setSelections({})
        loadLeaderboard()
      } else {
        showToast(`Error: ${data.error}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Admin actions ───────────────────────────────────────────────────────────
  const adminPost = async (body: object) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, pin: adminPin }),
    })
    return res
  }

  const handleAddMatch = async () => {
    if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.date || !newMatch.group) {
      showToast('Fill in all match fields'); return
    }
    setLoading(true)
    const res = await adminPost({ action: 'add_match', ...newMatch })
    const data = await res.json()
    if (res.ok) {
      showToast(`Match added! Odds: ${data.odds.home} / ${data.odds.draw} / ${data.odds.away}`)
      setNewMatch({ homeTeam: '', awayTeam: '', homeFlag: '', awayFlag: '', date: '', group: '' })
      loadMatches()
    } else {
      showToast(`Error: ${data.error}`)
    }
    setLoading(false)
  }

  const handleSetResult = async (matchId: string, result: 'home' | 'draw' | 'away') => {
    setLoading(true)
    const res = await adminPost({ action: 'set_result', matchId, result })
    if (res.ok) {
      showToast('Result saved! Leaderboard updated.')
      loadMatches(); loadLeaderboard()
    }
    setLoading(false)
  }

  const handleRefreshOdds = async (matchId: string) => {
    setLoading(true)
    const res = await adminPost({ action: 'refresh_odds', matchId })
    const data = await res.json()
    if (res.ok) {
      showToast(`Odds refreshed: ${data.odds.home} / ${data.odds.draw} / ${data.odds.away}`)
      loadMatches()
    }
    setLoading(false)
  }

  const handleSetManualOdds = async (matchId: string) => {
    const o = manualOdds[matchId]
    if (!o?.home || !o?.draw || !o?.away) { showToast('Enter all three odds'); return }
    setLoading(true)
    const res = await adminPost({ action: 'set_odds', matchId, ...o })
    if (res.ok) { showToast('Odds updated!'); loadMatches() }
    setLoading(false)
  }

  // ── Leaderboard stats ───────────────────────────────────────────────────────
  const finishedCount = matches.filter(m => m.status === 'finished').length
  const topPlayer = leaderboard[0]
  const totalBets = leaderboard.reduce((acc, p) => acc + p.betsPlaced, 0)

  return (
    <>
      <Head>
        <title>Family Bets ⚽</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.title}>Family Bets ⚽</div>
          <div style={s.subtitle}>Singapore Pools odds · Everyone bets, everyone tracks</div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {(['bet', 'leaderboard', 'admin'] as const).map(t => (
            <button
              key={t}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'bet' ? 'Place Bets' : t === 'leaderboard' ? '🏆 Leaderboard' : '⚙️ Admin'}
            </button>
          ))}
        </div>

        {/* ── Place Bets ── */}
        {tab === 'bet' && (
          <div>
            <input
              style={s.nameInput}
              placeholder="Your name (e.g. Uncle Kelvin)"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />

            {matches.length === 0 && (
              <div style={{ ...s.card, textAlign: 'center', color: '#888', padding: 40 }}>
                No matches set up yet.<br />Ask the admin to add matches!
              </div>
            )}

            {matches.filter(m => m.status !== 'finished').map(match => {
              const sel = selections[match.id]
              const odds = sel?.pick === 'home' ? match.odds.home
                : sel?.pick === 'draw' ? match.odds.draw
                : sel?.pick === 'away' ? match.odds.away : 0
              const potential = sel?.stake ? (sel.stake * odds).toFixed(2) : null

              return (
                <div key={match.id} style={s.card}>
                  <div style={s.matchTeams}>
                    {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
                  </div>
                  <div style={s.matchMeta}>
                    <span>{new Date(match.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</span>
                    <span>·</span><span>{match.group}</span>
                    <span>·</span>{statusBadge(match.status)}
                    {match.odds.fetchedAt && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#bbb' }}>
                        Odds as of {new Date(match.odds.fetchedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div style={s.oddsGrid}>
                    {(['home', 'draw', 'away'] as const).map(pick => {
                      const label = pick === 'home' ? match.homeTeam : pick === 'away' ? match.awayTeam : 'Draw'
                      const odd = pick === 'home' ? match.odds.home : pick === 'draw' ? match.odds.draw : match.odds.away
                      const selected = sel?.pick === pick
                      return (
                        <button
                          key={pick}
                          style={{ ...s.oddsBtn, ...(selected ? s.oddsBtnSelected : {}) }}
                          onClick={() => setSelections(prev => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], pick, odds: odd, stake: prev[match.id]?.stake ?? 0 }
                          }))}
                        >
                          <div style={{ ...s.oddsLabel, color: selected ? '#3b82f6' : '#888' }}>{label}</div>
                          <div style={{ ...s.oddsVal, color: selected ? '#1d4ed8' : '#1a1a1a' }}>
                            {odd > 0 ? odd.toFixed(2) : '—'}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div style={s.stakeRow}>
                    <span style={s.stakeLabel}>Stake $</span>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 10"
                      style={s.stakeInput}
                      value={sel?.stake || ''}
                      disabled={!sel?.pick}
                      onChange={e => {
                        const stake = parseFloat(e.target.value) || 0
                        setSelections(prev => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], stake }
                        }))
                      }}
                    />
                    <div style={s.potential}>
                      {potential ? `→ $${potential}` : sel?.pick ? 'Enter stake' : 'Pick first'}
                    </div>
                  </div>
                </div>
              )
            })}

            {matches.some(m => m.status !== 'finished') && (
              <button
                style={{ ...s.submitBtn, ...s.submitBtnPrimary, opacity: loading ? 0.6 : 1 }}
                onClick={submitBets}
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit bets →'}
              </button>
            )}
          </div>
        )}

        {/* ── Leaderboard ── */}
        {tab === 'leaderboard' && (
          <div>
            <div style={s.statGrid}>
              <div style={s.statCard}>
                <div style={s.statLabel}>Top winner</div>
                <div style={{ ...s.statVal, fontSize: 15 }}>{topPlayer?.name ?? '—'}</div>
                {topPlayer && (
                  <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                    {(topPlayer.totalPayout - topPlayer.totalStaked) >= 0 ? '+' : ''}
                    ${(topPlayer.totalPayout - topPlayer.totalStaked).toFixed(2)}
                  </div>
                )}
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>Matches done</div>
                <div style={s.statVal}>{finishedCount} / {matches.length}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>Total bets</div>
                <div style={s.statVal}>{totalBets}</div>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', color: '#888', padding: 40 }}>
                No bets placed yet. Be the first!
              </div>
            ) : (
              <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
                <table style={s.lbTable}>
                  <thead>
                    <tr>
                      <th style={{ ...s.lbTh, width: 40 }}>#</th>
                      <th style={s.lbTh}>Player</th>
                      <th style={{ ...s.lbTh, textAlign: 'right' as const }}>Profit</th>
                      <th style={{ ...s.lbTh, textAlign: 'right' as const }}>Hit rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((p, i) => {
                      const profit = p.totalPayout - p.totalStaked
                      const hitRate = p.betsPlaced > 0
                        ? `${p.betsWon}/${p.betsPlaced - (p.pendingBets ?? 0)}`
                        : '—'
                      return (
                        <tr key={p.name}>
                          <td style={{ ...s.lbTd, textAlign: 'center', fontSize: 16 }}>{rankEmoji(i)}</td>
                          <td style={s.lbTd}>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>
                              {p.betsPlaced} bets
                              {p.pendingBets > 0 && ` · ${p.pendingBets} pending`}
                            </div>
                          </td>
                          <td style={{ ...s.lbTd, textAlign: 'right', fontWeight: 700,
                            color: profit >= 0 ? '#16a34a' : '#dc2626' }}>
                            {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                          </td>
                          <td style={{ ...s.lbTd, textAlign: 'right', color: '#888', fontSize: 13 }}>
                            {hitRate}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Admin ── */}
        {tab === 'admin' && (
          <div>
            {!adminAuthed ? (
              <div style={s.card}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Admin PIN</div>
                <div style={s.adminSmall}>
                  Set your PIN via the ADMIN_PIN environment variable in Vercel (default: 1234).
                </div>
                <input
                  type="password"
                  style={s.adminInput}
                  placeholder="Enter admin PIN"
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') setAdminAuthed(true) }}
                />
                <button
                  style={{ ...s.submitBtn, ...s.submitBtnPrimary }}
                  onClick={() => setAdminAuthed(true)}
                >
                  Unlock admin →
                </button>
              </div>
            ) : (
              <>
                {/* Add match */}
                <div style={s.card}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Add match</div>
                  <div style={s.adminSmall}>
                    Odds are fetched automatically from Singapore Pools. You can override them manually after adding.
                  </div>
                  <div style={s.row}>
                    <input style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                      placeholder="Home team (e.g. Germany)" value={newMatch.homeTeam}
                      onChange={e => setNewMatch(p => ({ ...p, homeTeam: e.target.value }))} />
                    <input style={{ ...s.adminInput, marginBottom: 0, width: 60 }}
                      placeholder="🇩🇪" value={newMatch.homeFlag}
                      onChange={e => setNewMatch(p => ({ ...p, homeFlag: e.target.value }))} />
                  </div>
                  <div style={{ ...s.row, marginTop: 8 }}>
                    <input style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                      placeholder="Away team (e.g. Spain)" value={newMatch.awayTeam}
                      onChange={e => setNewMatch(p => ({ ...p, awayTeam: e.target.value }))} />
                    <input style={{ ...s.adminInput, marginBottom: 0, width: 60 }}
                      placeholder="🇪🇸" value={newMatch.awayFlag}
                      onChange={e => setNewMatch(p => ({ ...p, awayFlag: e.target.value }))} />
                  </div>
                  <div style={{ ...s.row, marginTop: 8 }}>
                    <input style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                      type="date" value={newMatch.date}
                      onChange={e => setNewMatch(p => ({ ...p, date: e.target.value }))} />
                    <input style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                      placeholder="Group (e.g. Group B)" value={newMatch.group}
                      onChange={e => setNewMatch(p => ({ ...p, group: e.target.value }))} />
                  </div>
                  <button
                    style={{ ...s.submitBtn, ...s.submitBtnPrimary, marginTop: 12, opacity: loading ? 0.6 : 1 }}
                    onClick={handleAddMatch} disabled={loading}
                  >
                    {loading ? 'Adding & fetching odds…' : 'Add match & fetch SG Pools odds →'}
                  </button>
                </div>

                <div style={s.divider} />

                {/* Manage matches */}
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Manage matches</div>
                {matches.length === 0 && (
                  <div style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>No matches yet.</div>
                )}
                {matches.map(match => (
                  <div key={match.id} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
                        </div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          {new Date(match.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })} · {match.group}
                        </div>
                      </div>
                      {statusBadge(match.status)}
                    </div>

                    {/* Current odds + refresh */}
                    <div style={{ fontSize: 13, color: '#444', marginBottom: 10 }}>
                      <strong>Current odds:</strong>{' '}
                      {match.odds.home > 0
                        ? `${match.homeTeam} ${match.odds.home.toFixed(2)} · Draw ${match.odds.draw.toFixed(2)} · ${match.awayTeam} ${match.odds.away.toFixed(2)}`
                        : 'Not set yet'
                      }
                      {' '}
                      <button
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, padding: 0 }}
                        onClick={() => handleRefreshOdds(match.id)}
                      >
                        Refresh from SG Pools ↺
                      </button>
                    </div>

                    {/* Manual odds override */}
                    <div style={{ ...s.row, marginBottom: 10 }}>
                      <input
                        style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                        placeholder={`${match.homeTeam} odds`}
                        value={manualOdds[match.id]?.home ?? ''}
                        onChange={e => setManualOdds(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                      />
                      <input
                        style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                        placeholder="Draw odds"
                        value={manualOdds[match.id]?.draw ?? ''}
                        onChange={e => setManualOdds(p => ({ ...p, [match.id]: { ...p[match.id], draw: e.target.value } }))}
                      />
                      <input
                        style={{ ...s.adminInput, marginBottom: 0, flex: 1 }}
                        placeholder={`${match.awayTeam} odds`}
                        value={manualOdds[match.id]?.away ?? ''}
                        onChange={e => setManualOdds(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
                      />
                      <button
                        style={{ ...s.submitBtn, width: 'auto', padding: '0 14px', marginTop: 0 }}
                        onClick={() => handleSetManualOdds(match.id)}
                      >
                        Set
                      </button>
                    </div>

                    {/* Set result */}
                    {match.status !== 'finished' ? (
                      <div>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Set result:</div>
                        <div style={s.oddsGrid}>
                          {(['home', 'draw', 'away'] as const).map(r => (
                            <button
                              key={r}
                              style={{
                                ...s.oddsBtn,
                                fontSize: 13,
                                ...(match.result === r ? s.oddsBtnSelected : {})
                              }}
                              onClick={() => handleSetResult(match.id, r)}
                            >
                              {r === 'home' ? `${match.homeTeam} wins`
                                : r === 'away' ? `${match.awayTeam} wins`
                                : 'Draw'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        ✓ Result: {match.result === 'home' ? `${match.homeTeam} wins`
                          : match.result === 'away' ? `${match.awayTeam} wins`
                          : 'Draw'}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </>
  )
}
