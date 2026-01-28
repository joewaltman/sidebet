// ESPN API client for fetching game data

export interface ESPNGame {
  id: string;
  league: 'nfl' | 'nba';
  date: string; // ISO datetime
  status: string; // 'pre', 'in', 'post', etc.
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
    score?: number;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
    score?: number;
  };
  homeSpread?: number;
  awaySpread?: number;
}

interface ESPNResponse {
  events: Array<{
    id: string;
    date: string;
    status: {
      type: {
        name: string;
        state: string;
      };
    };
    competitions: Array<{
      competitors: Array<{
        id: string;
        team: {
          id: string;
          displayName: string;
          abbreviation: string;
          logo?: string;
        };
        homeAway: 'home' | 'away';
        score?: string;
      }>;
      odds?: Array<{
        provider: {
          id: string;
          name: string;
        };
        details?: string;
        overUnder?: number;
        spread?: number;
        homeTeamOdds?: {
          favorite?: boolean;
          underdog?: boolean;
          moneyLine?: number;
          spreadOdds?: number;
        };
        awayTeamOdds?: {
          favorite?: boolean;
          underdog?: boolean;
          moneyLine?: number;
          spreadOdds?: number;
        };
      }>;
    }>;
  }>;
}

const ESPN_BASE_URL = 'http://site.api.espn.com/apis/site/v2/sports';

// Cache for API responses (1 hour)
const cache = new Map<string, { data: ESPNGame[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch games from ESPN API for a specific league
 */
async function fetchLeagueGames(league: 'nfl' | 'nba'): Promise<ESPNGame[]> {
  const sport = league === 'nfl' ? 'football' : 'basketball';
  const url = `${ESPN_BASE_URL}/${sport}/${league}/scoreboard`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
  }

  const data: ESPNResponse = await response.json();

  return data.events.map((event) => {
    const competition = event.competitions[0];
    const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) {
      throw new Error('Invalid competition data');
    }

    // Extract point spreads from odds (prefer Caesars or first available)
    let homeSpread: number | undefined;
    let awaySpread: number | undefined;

    if (competition.odds && competition.odds.length > 0) {
      // Try to find Caesars (id: 38) or consensus odds first
      const preferredOdds = competition.odds.find(
        (odd) => odd.provider.id === '38' || odd.provider.name.toLowerCase().includes('consensus')
      ) || competition.odds[0]; // Fallback to first provider

      if (preferredOdds && preferredOdds.spread !== undefined) {
        // ESPN provides the spread as a single number
        // Negative = home team favored, Positive = away team favored
        if (preferredOdds.homeTeamOdds?.favorite) {
          homeSpread = -Math.abs(preferredOdds.spread);
          awaySpread = Math.abs(preferredOdds.spread);
        } else {
          homeSpread = Math.abs(preferredOdds.spread);
          awaySpread = -Math.abs(preferredOdds.spread);
        }
      }
    }

    return {
      id: event.id,
      league,
      date: event.date,
      status: event.status.type.name.toLowerCase(),
      homeTeam: {
        id: homeCompetitor.team.id,
        name: homeCompetitor.team.displayName,
        abbreviation: homeCompetitor.team.abbreviation,
        logo: homeCompetitor.team.logo,
        score: homeCompetitor.score ? parseInt(homeCompetitor.score) : undefined,
      },
      awayTeam: {
        id: awayCompetitor.team.id,
        name: awayCompetitor.team.displayName,
        abbreviation: awayCompetitor.team.abbreviation,
        logo: awayCompetitor.team.logo,
        score: awayCompetitor.score ? parseInt(awayCompetitor.score) : undefined,
      },
      homeSpread,
      awaySpread,
    };
  });
}

/**
 * Get upcoming games from ESPN (NFL and NBA)
 * Results are cached for 1 hour
 */
export async function getUpcomingGames(league?: 'nfl' | 'nba'): Promise<ESPNGame[]> {
  const cacheKey = league || 'all';

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch fresh data
  let games: ESPNGame[] = [];

  if (league) {
    games = await fetchLeagueGames(league);
  } else {
    // Fetch both leagues
    const [nflGames, nbaGames] = await Promise.all([
      fetchLeagueGames('nfl'),
      fetchLeagueGames('nba'),
    ]);
    games = [...nflGames, ...nbaGames];
  }

  // Filter for upcoming games (not yet started)
  const upcomingGames = games.filter(
    (game) => game.status === 'pre' || game.status === 'scheduled' || game.status === 'status_scheduled'
  );

  // Sort by date
  upcomingGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Update cache
  cache.set(cacheKey, { data: upcomingGames, timestamp: Date.now() });

  return upcomingGames;
}

/**
 * Get game details by ID (for checking results)
 */
export async function getGameById(gameId: string, league: 'nfl' | 'nba'): Promise<ESPNGame | null> {
  // Fetch all games and find the specific one
  const games = await fetchLeagueGames(league);
  return games.find((game) => game.id === gameId) || null;
}

/**
 * Check if a game is completed
 */
export function isGameCompleted(game: ESPNGame): boolean {
  return game.status === 'post' || game.status === 'final' || game.status === 'status_final';
}

/**
 * Determine the winner of a bet based on point spread
 * @param game - Completed game
 * @param chosenTeamId - ID of the team the bet is on
 * @param pointSpread - Point spread (negative = favorite, positive = underdog)
 * @returns 'win' if chosen team covered the spread, 'loss' if not, 'push' if exact
 */
export function determineBetWinner(
  game: ESPNGame,
  chosenTeamId: string,
  pointSpread: number
): 'win' | 'loss' | 'push' {
  if (!game.homeTeam.score || !game.awayTeam.score) {
    throw new Error('Game does not have final scores');
  }

  const isHomeTeam = game.homeTeam.id === chosenTeamId;
  const chosenScore = isHomeTeam ? game.homeTeam.score : game.awayTeam.score;
  const opponentScore = isHomeTeam ? game.awayTeam.score : game.homeTeam.score;

  // Calculate actual point differential (positive if chosen team won)
  const actualDiff = chosenScore - opponentScore;

  // Apply point spread
  const coverDiff = actualDiff - pointSpread;

  if (coverDiff > 0) {
    return 'win'; // Chosen team covered the spread
  } else if (coverDiff < 0) {
    return 'loss'; // Chosen team did not cover
  } else {
    return 'push'; // Exact spread, no winner
  }
}
