import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '@/lib/phone';
import { upsertUser, createBet } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorPhone,
      creatorFirstName,
      creatorLastName,
      gameId,
      gameName,
      gameDate,
      chosenTeam,
      chosenTeamId,
      pointSpread,
      maxAmount,
    } = body;

    // Validate required fields
    if (
      !creatorPhone ||
      !creatorFirstName ||
      !creatorLastName ||
      !gameId ||
      !gameName ||
      !gameDate ||
      !chosenTeam ||
      !chosenTeamId ||
      pointSpread === undefined ||
      !maxAmount
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    if (maxAmount <= 0) {
      return NextResponse.json(
        { error: 'Max amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Normalize phone number
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(creatorPhone);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Create or update user
    upsertUser(normalizedPhone, creatorFirstName, creatorLastName);

    // Generate bet ID
    const betId = uuidv4();

    // Create bet
    const bet = createBet({
      id: betId,
      creator_phone: normalizedPhone,
      game_id: gameId,
      game_name: gameName,
      game_date: gameDate,
      chosen_team: chosenTeam,
      chosen_team_id: chosenTeamId,
      point_spread: parseFloat(pointSpread),
      max_amount: parseFloat(maxAmount),
    });

    // Generate shareable link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const shareLink = `${baseUrl}/bet/${betId}`;

    return NextResponse.json({
      betId: bet.id,
      shareLink,
    });
  } catch (error) {
    console.error('Error creating bet:', error);
    return NextResponse.json(
      { error: 'Failed to create bet' },
      { status: 500 }
    );
  }
}
