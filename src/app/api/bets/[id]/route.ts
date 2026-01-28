import { NextRequest, NextResponse } from 'next/server';
import { getBetWithCreator, getBetResult } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get bet with creator info
    const bet = getBetWithCreator(id);

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Get result if settled
    const result = getBetResult(id);

    // Format response
    const betDetails = {
      id: bet.id,
      creatorPhone: bet.creator_phone,
      creatorFirstName: bet.creator_first_name,
      creatorLastName: bet.creator_last_name,
      gameId: bet.game_id,
      gameName: bet.game_name,
      gameDate: bet.game_date,
      chosenTeam: bet.chosen_team,
      chosenTeamId: bet.chosen_team_id,
      pointSpread: bet.point_spread,
      maxAmount: bet.max_amount,
      status: bet.status,
      createdAt: bet.created_at,
    };

    return NextResponse.json({
      bet: betDetails,
      result: result ? {
        id: result.id,
        betId: result.bet_id,
        winningTeamId: result.winning_team_id,
        homeScore: result.home_score,
        awayScore: result.away_score,
        settledAt: result.settled_at,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching bet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bet' },
      { status: 500 }
    );
  }
}
