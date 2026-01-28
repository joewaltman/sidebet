'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import BetForm from '@/components/BetForm';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import type { Game } from '@/types';

function CreateBetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUser();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const gameId = searchParams.get('gameId');
  const league = searchParams.get('league') as 'nfl' | 'nba' | null;

  useEffect(() => {
    if (!gameId || !league) {
      setError('Invalid game parameters');
      setLoading(false);
      return;
    }

    fetchGame();
  }, [gameId, league]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games?league=${league}`);

      if (!response.ok) {
        throw new Error('Failed to fetch game');
      }

      const data = await response.json();
      const foundGame = data.games.find((g: Game) => g.id === gameId);

      if (!foundGame) {
        throw new Error('Game not found');
      }

      setGame(foundGame);
    } catch (err) {
      setError('Failed to load game. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (phoneNumber: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, firstName, lastName }),
      });

      if (!response.ok) {
        throw new Error('Failed to set session');
      }

      const data = await response.json();
      setUser({
        phoneNumber: data.normalizedPhone,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    } catch (error) {
      console.error('Error setting session:', error);
      alert('Failed to set session. Please try again.');
    }
  };

  const handleBetSubmit = async (betData: {
    chosenTeam: string;
    chosenTeamId: string;
    pointSpread: number;
    maxAmount: number;
  }) => {
    if (!user || !game) return;

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorPhone: user.phoneNumber,
          creatorFirstName: user.firstName,
          creatorLastName: user.lastName,
          gameId: game.id,
          gameName: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
          gameDate: game.date,
          chosenTeam: betData.chosenTeam,
          chosenTeamId: betData.chosenTeamId,
          pointSpread: betData.pointSpread,
          maxAmount: betData.maxAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create bet');
      }

      const data = await response.json();

      // Copy share link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data.shareLink);
        alert('Bet created! Share link copied to clipboard.');
      } else {
        alert(`Bet created! Share this link: ${data.shareLink}`);
      }

      // Redirect to bet page
      router.push(`/bet/${data.betId}`);
    } catch (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading game...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Game not found'}</div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Bet</h1>
            <div className="flex items-center gap-4">
              {user && (
                <a
                  href="/my-bets"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  My Bets
                </a>
              )}
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-center mb-6">
                Sign In to Create Bet
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Enter your phone number and name to continue
              </p>
              <PhoneNumberInput onSubmit={handlePhoneSubmit} />
            </div>
          </div>
        ) : (
          <BetForm
            game={game}
            userPhone={user.phoneNumber}
            userFirstName={user.firstName}
            userLastName={user.lastName}
            onSubmit={handleBetSubmit}
          />
        )}
      </main>
    </div>
  );
}

export default function CreateBetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <CreateBetContent />
    </Suspense>
  );
}
