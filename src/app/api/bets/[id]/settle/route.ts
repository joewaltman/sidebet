import { NextRequest, NextResponse } from 'next/server';
import { getBet, updateBetStatus, createBetResult, getBetResult, getBetAcceptancesWithUsers, getUser } from '@/lib/db';
import { getGameById, isGameCompleted, determineBetWinner } from '@/lib/espn';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: betId } = await params;

    // Get bet
    const bet = getBet(betId);
    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Check if already settled
    if (bet.status === 'settled') {
      const existingResult = getBetResult(betId);
      return NextResponse.json({
        message: 'Bet already settled',
        result: existingResult,
      });
    }

    // Fetch game details from ESPN
    const league = bet.game_id.startsWith('401') ? 'nfl' : 'nba'; // Simple heuristic
    const game = await getGameById(bet.game_id, league);

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if game is completed
    if (!isGameCompleted(game)) {
      return NextResponse.json(
        { error: 'Game is not yet completed' },
        { status: 400 }
      );
    }

    // Determine winner based on point spread
    const outcome = determineBetWinner(game, bet.chosen_team_id, bet.point_spread);

    if (outcome === 'push') {
      // Push - no winner, just mark as settled
      updateBetStatus(betId, 'settled');
      const result = createBetResult(
        betId,
        '', // No winner
        game.homeTeam.score!,
        game.awayTeam.score!
      );

      return NextResponse.json({
        result,
        outcome: 'push',
        message: 'Push - exact spread, no winner',
      });
    }

    // Determine winning team ID based on outcome
    const winningTeamId = outcome === 'win' ? bet.chosen_team_id :
      (game.homeTeam.id === bet.chosen_team_id ? game.awayTeam.id : game.homeTeam.id);

    // Create result
    const result = createBetResult(
      betId,
      winningTeamId,
      game.homeTeam.score!,
      game.awayTeam.score!
    );

    // Update bet status
    updateBetStatus(betId, 'settled');

    // Get acceptances and creator info for IOU calculation
    const acceptances = getBetAcceptancesWithUsers(betId);
    const creator = getUser(bet.creator_phone);

    if (!creator) {
      throw new Error('Creator not found');
    }

    // Calculate IOUs
    const ious = [];

    if (outcome === 'win') {
      // Creator won - acceptors owe creator
      for (const acceptance of acceptances) {
        ious.push({
          debtor: `${acceptance.first_name} ${acceptance.last_name}`,
          creditor: `${creator.first_name} ${creator.last_name}`,
          amount: acceptance.amount,
        });
      }
    } else {
      // Creator lost - creator owes acceptors
      for (const acceptance of acceptances) {
        ious.push({
          debtor: `${creator.first_name} ${creator.last_name}`,
          creditor: `${acceptance.first_name} ${acceptance.last_name}`,
          amount: acceptance.amount,
        });
      }
    }

    return NextResponse.json({
      result,
      outcome,
      ious,
      message: outcome === 'win' ? 'Creator won!' : 'Acceptors won!',
    });
  } catch (error) {
    console.error('Error settling bet:', error);
    return NextResponse.json(
      { error: 'Failed to settle bet' },
      { status: 500 }
    );
  }
}
