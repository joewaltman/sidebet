import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, firstName, lastName } = body;

    // Validate required fields
    if (!phoneNumber || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Normalize phone number
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phoneNumber);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      normalizedPhone,
      firstName,
      lastName,
    });
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
}
