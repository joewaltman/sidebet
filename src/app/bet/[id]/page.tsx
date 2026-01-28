'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import BetDetails from '@/components/BetDetails';
import AcceptBetForm from '@/components/AcceptBetForm';
import BetStatus from '@/components/BetStatus';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import type { BetDetails as BetDetailsType, BetResult, IOU } from '@/types';

interface BetPageProps {
  params: Promise<{ id: string }>;
}

export default function BetPage({ params }: BetPageProps) {
  const resolvedParams = use(params);
  const betId = resolvedParams.id;
  const router = useRouter();
  const { user, setUser } = useUser();

  const [bet, setBet] = useState<BetDetailsType | null>(null);
  const [result, setResult] = useState<BetResult | null>(null);
  const [ious, setIous] = useState<IOU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetchBet();
  }, [betId]);

  const fetchBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bets/${betId}`);

      if (!response.ok) {
        throw new Error('Bet not found');
      }

      const data = await response.json();
      setBet(data.bet);
      setResult(data.result);

      // If bet is settled, fetch IOUs
      if (data.result) {
        await fetchIous();
      }
    } catch (err) {
      setError('Failed to load bet. Please check the link and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIous = async () => {
    try {
      const response = await fetch(`/api/bets/${betId}/settle`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIous(data.ious || []);
      }
    } catch (err) {
      console.error('Error fetching IOUs:', err);
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

  const handleAcceptBet = async (amount: number) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/bets/${betId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptorPhone: user.phoneNumber,
          acceptorFirstName: user.firstName,
          acceptorLastName: user.lastName,
          amount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept bet');
      }

      setAccepted(true);
      alert('Bet accepted successfully!');
    } catch (error) {
      console.error('Error accepting bet:', error);
      alert(error instanceof Error ? error.message : 'Failed to accept bet');
      throw error;
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } else {
        alert(`Share this link: ${url}`);
      }
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading bet...</div>
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Bet not found'}</div>
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

  const isCreator = user?.phoneNumber === bet.creatorPhone;
  const gameDate = new Date(bet.gameDate);
  const canAccept = bet.status === 'open' && gameDate.getTime() > Date.now() && !isCreator && !accepted;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Bet Details</h1>
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
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Bet Details */}
          <BetDetails bet={bet} />

          {/* Show Result if Settled */}
          {result && bet.status === 'settled' && (
            <BetStatus
              result={result}
              ious={ious}
              userPhone={user?.phoneNumber || ''}
              chosenTeam={bet.chosenTeam}
              chosenTeamId={bet.chosenTeamId}
              pointSpread={bet.pointSpread}
            />
          )}

          {/* Accept Bet Section */}
          {canAccept && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Accept This Bet</h2>

              {!user ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Enter your phone number and name to accept this bet
                  </p>
                  <PhoneNumberInput onSubmit={handlePhoneSubmit} />
                </div>
              ) : (
                <AcceptBetForm maxAmount={bet.maxAmount} onSubmit={handleAcceptBet} />
              )}
            </div>
          )}

          {/* Status Messages */}
          {isCreator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-semibold">This is your bet</p>
              <p className="text-blue-700 text-sm mt-1">
                Share the link with friends to let them accept your bet
              </p>
              <button
                onClick={handleCopyLink}
                className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Copy Share Link
              </button>
            </div>
          )}

          {accepted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900 font-semibold">Bet Accepted!</p>
              <p className="text-green-700 text-sm mt-1">
                You will be notified when the game is completed and the bet is settled.
              </p>
            </div>
          )}

          {!canAccept && !isCreator && bet.status === 'open' && gameDate.getTime() <= Date.now() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-900 font-semibold">Game has started</p>
              <p className="text-yellow-700 text-sm mt-1">
                This bet can no longer be accepted.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
