'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import MyBetCard from '@/components/MyBetCard';

interface CreatedBet {
  id: string;
  creator_phone: string;
  game_id: string;
  game_name: string;
  game_date: string;
  chosen_team: string;
  chosen_team_id: string;
  point_spread: number;
  max_amount: number;
  status: 'open' | 'settled';
  created_at: string;
  result?: {
    winning_team_id: string;
    home_score: number;
    away_score: number;
  } | null;
  acceptances?: Array<{
    first_name: string;
    last_name: string;
    amount: number;
  }>;
}

interface AcceptedBet {
  id: number;
  bet_id: string;
  acceptor_phone: string;
  amount: number;
  accepted_at: string;
  game_name: string;
  game_date: string;
  chosen_team: string;
  chosen_team_id: string;
  point_spread: number;
  max_amount: number;
  status: 'open' | 'settled';
  creator_phone: string;
  result?: {
    winning_team_id: string;
    home_score: number;
    away_score: number;
  } | null;
}

export default function MyBetsPage() {
  const router = useRouter();
  const { user, setUser, isLoading } = useUser();

  const [createdBets, setCreatedBets] = useState<CreatedBet[]>([]);
  const [acceptedBets, setAcceptedBets] = useState<AcceptedBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'created' | 'accepted'>('created');

  useEffect(() => {
    if (user?.phoneNumber) {
      fetchBets();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading]);

  const fetchBets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/my-bets?phone=${encodeURIComponent(user.phoneNumber)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bets');
      }

      const data = await response.json();
      setCreatedBets(data.created || []);
      setAcceptedBets(data.accepted || []);
    } catch (err) {
      setError('Failed to load your bets. Please try again.');
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Bets</h1>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Sign In to View Your Bets</h2>
              <p className="text-gray-600 text-center mb-6">
                Enter your phone number and name to continue
              </p>
              <PhoneNumberInput onSubmit={handlePhoneSubmit} />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchBets}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setActiveTab('created')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'created'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bets I Created ({createdBets.length})
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'accepted'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bets I Accepted ({acceptedBets.length})
              </button>
            </div>

            {/* Bets List */}
            {activeTab === 'created' ? (
              <div>
                {createdBets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">You haven't created any bets yet.</p>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Bet
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdBets.map((bet) => (
                      <MyBetCard
                        key={bet.id}
                        betId={bet.id}
                        gameName={bet.game_name}
                        gameDate={bet.game_date}
                        chosenTeam={bet.chosen_team}
                        pointSpread={bet.point_spread}
                        amount={bet.max_amount}
                        status={bet.status}
                        isCreator={true}
                        result={
                          bet.result
                            ? {
                                winningTeamId: bet.result.winning_team_id,
                                homeScore: bet.result.home_score,
                                awayScore: bet.result.away_score,
                              }
                            : null
                        }
                        chosenTeamId={bet.chosen_team_id}
                        acceptances={bet.acceptances}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {acceptedBets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">You haven't accepted any bets yet.</p>
                    <p className="text-sm text-gray-500">
                      When friends share bet links with you, they'll appear here after you accept them.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedBets.map((bet) => (
                      <MyBetCard
                        key={bet.id}
                        betId={bet.bet_id}
                        gameName={bet.game_name}
                        gameDate={bet.game_date}
                        chosenTeam={bet.chosen_team}
                        pointSpread={bet.point_spread}
                        amount={bet.amount}
                        status={bet.status}
                        isCreator={false}
                        result={
                          bet.result
                            ? {
                                winningTeamId: bet.result.winning_team_id,
                                homeScore: bet.result.home_score,
                                awayScore: bet.result.away_score,
                              }
                            : null
                        }
                        chosenTeamId={bet.chosen_team_id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
