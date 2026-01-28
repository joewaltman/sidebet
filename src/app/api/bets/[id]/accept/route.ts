import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { upsertUser, getBet, getAcceptance, createAcceptance } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: betId } = await params;
    const body = await request.json();
    const { acceptorPhone, acceptorFirstName, acceptorLastName, amount } = body;

    // Validate required fields
    if (!acceptorPhone || !acceptorFirstName || !acceptorLastName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Normalize phone number
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(acceptorPhone);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Get bet
    const bet = getBet(betId);
    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Check if bet is still open
    if (bet.status !== 'open') {
      return NextResponse.json(
        { error: 'Bet is no longer open' },
        { status: 400 }
      );
    }

    // Check if game has started
    const gameDate = new Date(bet.game_date);
    if (gameDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      );
    }

    // Validate amount
    const acceptAmount = parseFloat(amount);
    if (acceptAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (acceptAmount > bet.max_amount) {
      return NextResponse.json(
        { error: `Amount cannot exceed max bet amount of $${bet.max_amount}` },
        { status: 400 }
      );
    }

    // Check if user already accepted this bet
    const existingAcceptance = getAcceptance(betId, normalizedPhone);
    if (existingAcceptance) {
      return NextResponse.json(
        { error: 'You have already accepted this bet' },
        { status: 400 }
      );
    }

    // Check if acceptor is the creator
    if (normalizedPhone === bet.creator_phone) {
      return NextResponse.json(
        { error: 'You cannot accept your own bet' },
        { status: 400 }
      );
    }

    // Create or update user
    upsertUser(normalizedPhone, acceptorFirstName, acceptorLastName);

    // Create acceptance
    const acceptance = createAcceptance(betId, normalizedPhone, acceptAmount);

    return NextResponse.json({
      success: true,
      acceptance: {
        id: acceptance.id,
        betId: acceptance.bet_id,
        acceptorPhone: acceptance.acceptor_phone,
        amount: acceptance.amount,
        acceptedAt: acceptance.accepted_at,
      },
    });
  } catch (error) {
    console.error('Error accepting bet:', error);
    return NextResponse.json(
      { error: 'Failed to accept bet' },
      { status: 500 }
    );
  }
}
