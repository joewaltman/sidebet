import { NextRequest, NextResponse } from 'next/server';
import { getBetsCreatedByUser, getBetsAcceptedByUser, getBetResult, getBetAcceptancesWithUsers } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get bets created by user
    const createdBets = getBetsCreatedByUser(phoneNumber);

    // Get bets accepted by user
    const acceptedBets = getBetsAcceptedByUser(phoneNumber);

    // Add result information and acceptances for created bets
    const createdBetsWithResults = createdBets.map((bet) => {
      const result = bet.status === 'settled' ? getBetResult(bet.id) : null;
      const acceptances = getBetAcceptancesWithUsers(bet.id);
      return {
        ...bet,
        result,
        acceptances,
      };
    });

    const acceptedBetsWithResults = acceptedBets.map((acceptance) => {
      const result = acceptance.status === 'settled' ? getBetResult(acceptance.bet_id) : null;
      return {
        ...acceptance,
        result,
      };
    });

    return NextResponse.json({
      created: createdBetsWithResults,
      accepted: acceptedBetsWithResults,
    });
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    );
  }
}
