import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingGames } from '@/lib/espn';
import { getSpreads, matchGamesWithSpreads } from '@/lib/odds';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') as 'nfl' | 'nba' | null;

    // Fetch games from ESPN (includes spreads from their betting partners)
    const espnGames = await getUpcomingGames(league || undefined);

    // Optionally fetch spreads from The Odds API as fallback for games without ESPN spreads
    // This requires ODDS_API_KEY environment variable
    let oddsApiSpreads: Map<string, { homeSpread: number; awaySpread: number }> | null = null;

    if (process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_api_key_here') {
      try {
        const spreads = await getSpreads(league || undefined);
        oddsApiSpreads = matchGamesWithSpreads(espnGames, spreads);
      } catch (error) {
        console.warn('Failed to fetch from The Odds API (using ESPN spreads only):', error);
      }
    }

    // Map games with spreads
    const games = espnGames.map((game) => {
      // Use ESPN spreads if available, otherwise try The Odds API fallback
      let homeSpread = game.homeSpread;
      let awaySpread = game.awaySpread;

      if ((homeSpread === undefined || awaySpread === undefined) && oddsApiSpreads) {
        const oddsSpread = oddsApiSpreads.get(game.id);
        if (oddsSpread) {
          homeSpread = oddsSpread.homeSpread;
          awaySpread = oddsSpread.awaySpread;
        }
      }

      return {
        id: game.id,
        league: game.league,
        homeTeam: {
          id: game.homeTeam.id,
          name: game.homeTeam.name,
          abbreviation: game.homeTeam.abbreviation,
          logo: game.homeTeam.logo,
        },
        awayTeam: {
          id: game.awayTeam.id,
          name: game.awayTeam.name,
          abbreviation: game.awayTeam.abbreviation,
          logo: game.awayTeam.logo,
        },
        date: game.date,
        homeSpread,
        awaySpread,
      };
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
