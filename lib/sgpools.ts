/**
 * Singapore Pools odds fetcher.
 *
 * SG Pools does not provide a public API. This module fetches the
 * football odds page and parses it with cheerio.
 *
 * NOTE: If SG Pools changes their HTML structure this scraper may
 * need updating. The admin can also manually override odds via the
 * admin panel at any time.
 */

import * as cheerio from 'cheerio'

export interface PoolsOdds {
  home: number
  draw: number
  away: number
  fetchedAt: string
}

// SG Pools football odds URL
const ODDS_URL = 'https://www.singaporepools.com.sg/en/product/sr/pages/football_odds.aspx'

export async function fetchSGPoolsOdds(
  homeTeam: string,
  awayTeam: string
): Promise<PoolsOdds | null> {
  try {
    const res = await fetch(ODDS_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      next: { revalidate: 300 }, // cache for 5 minutes
    })

    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    // SG Pools renders odds in a table; rows contain team names and odds
    // We search for a row containing both team names (case-insensitive)
    let found: PoolsOdds | null = null

    $('tr').each((_, row) => {
      const text = $(row).text()
      const homeLower = homeTeam.toLowerCase()
      const awayLower = awayTeam.toLowerCase()

      if (
        text.toLowerCase().includes(homeLower) &&
        text.toLowerCase().includes(awayLower)
      ) {
        // Extract all numbers that look like odds (1.00 – 50.00)
        const nums = [...text.matchAll(/\b(\d{1,2}\.\d{2})\b/g)]
          .map(m => parseFloat(m[1]))
          .filter(n => n >= 1 && n <= 50)

        if (nums.length >= 3) {
          found = {
            home: nums[0],
            draw: nums[1],
            away: nums[2],
            fetchedAt: new Date().toISOString(),
          }
          return false // break .each()
        }
      }
    })

    return found
  } catch (err) {
    console.error('SG Pools fetch error:', err)
    return null
  }
}

/**
 * Returns fallback odds when live fetch fails.
 * These are typical football 1X2 odds ranges.
 */
export function fallbackOdds(): PoolsOdds {
  return {
    home: 0,
    draw: 0,
    away: 0,
    fetchedAt: new Date().toISOString(),
  }
}
