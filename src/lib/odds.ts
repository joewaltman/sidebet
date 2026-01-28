// The Odds API client for fetching point spreads

export interface GameSpread {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeSpread: number;
  awaySpread: number;
  commenceTime: string;
}

interface OddsAPIResponse {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price?: number;
        point?: number;
      }>;
    }>;
  }>;
}

const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports';
const ODDS_API_KEY = process.env.ODDS_API_KEY;

// Sport keys for The Odds API
const SPORT_KEYS = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
};

// Cache for API responses (1 hour)
const cache = new Map<string, { data: GameSpread[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch spreads from The Odds API for a specific league
 */
async function fetchLeagueSpreads(league: 'nfl' | 'nba'): Promise<GameSpread[]> {
  if (!ODDS_API_KEY || ODDS_API_KEY === 'your_api_key_here') {
    console.warn('The Odds API key not configured. Spreads will not be available.');
    return [];
  }

  const sportKey = SPORT_KEYS[league];
  const url = `${ODDS_API_BASE_URL}/${sportKey}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads&oddsFormat=american`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`The Odds API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: OddsAPIResponse[] = await response.json();

    return data.map((game) => {
      // Get the first bookmaker's spreads (typically DraftKings or FanDuel)
      const spreadsMarket = game.bookmakers[0]?.markets.find((m) => m.key === 'spreads');

      if (!spreadsMarket) {
        return null;
      }

      const homeOutcome = spreadsMarket.outcomes.find((o) => o.name === game.home_team);
      const awayOutcome = spreadsMarket.outcomes.find((o) => o.name === game.away_team);

      if (!homeOutcome || !awayOutcome || homeOutcome.point === undefined || awayOutcome.point === undefined) {
        return null;
      }

      return {
        gameId: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeSpread: homeOutcome.point,
        awaySpread: awayOutcome.point,
        commenceTime: game.commence_time,
      };
    }).filter((spread): spread is GameSpread => spread !== null);
  } catch (error) {
    console.error('Error fetching odds:', error);
    return [];
  }
}

/**
 * Get spreads for games (NFL and NBA)
 * Results are cached for 1 hour
 */
export async function getSpreads(league?: 'nfl' | 'nba'): Promise<GameSpread[]> {
  const cacheKey = league || 'all';

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch fresh data
  let spreads: GameSpread[] = [];

  if (league) {
    spreads = await fetchLeagueSpreads(league);
  } else {
    // Fetch both leagues
    const [nflSpreads, nbaSpreads] = await Promise.all([
      fetchLeagueSpreads('nfl'),
      fetchLeagueSpreads('nba'),
    ]);
    spreads = [...nflSpreads, ...nbaSpreads];
  }

  // Update cache
  cache.set(cacheKey, { data: spreads, timestamp: Date.now() });

  return spreads;
}

/**
 * Match ESPN games with spreads from The Odds API
 * Matches by team names and date proximity
 */
export function matchGamesWithSpreads(
  espnGames: Array<{ id: string; homeTeam: { name: string }; awayTeam: { name: string }; date: string }>,
  spreads: GameSpread[]
): Map<string, GameSpread> {
  const matches = new Map<string, GameSpread>();

  for (const game of espnGames) {
    // Try to find matching spread by team names
    const match = spreads.find((spread) => {
      // Simple name matching (could be improved with fuzzy matching)
      const homeMatch = spread.homeTeam.toLowerCase().includes(game.homeTeam.name.toLowerCase()) ||
                        game.homeTeam.name.toLowerCase().includes(spread.homeTeam.toLowerCase());
      const awayMatch = spread.awayTeam.toLowerCase().includes(game.awayTeam.name.toLowerCase()) ||
                        game.awayTeam.name.toLowerCase().includes(spread.awayTeam.toLowerCase());

      // Also check date proximity (within 24 hours)
      const espnDate = new Date(game.date).getTime();
      const spreadDate = new Date(spread.commenceTime).getTime();
      const dateDiff = Math.abs(espnDate - spreadDate);
      const oneDayMs = 24 * 60 * 60 * 1000;

      return homeMatch && awayMatch && dateDiff < oneDayMs;
    });

    if (match) {
      matches.set(game.id, match);
    }
  }

  return matches;
}

/**
 * Format spread for display
 * @param spread - The point spread value
 * @returns Formatted spread (e.g., "-7.5" or "+3.5")
 */
export function formatSpread(spread: number): string {
  if (spread > 0) {
    return `+${spread}`;
  }
  return `${spread}`;
}
