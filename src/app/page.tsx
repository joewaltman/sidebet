'use client';

import { useUser } from '@/context/UserContext';
import GameList from '@/components/GameList';
import PhoneNumberInput from '@/components/PhoneNumberInput';

export default function Home() {
  const { user, setUser, isLoading } = useUser();

  const handlePhoneSubmit = async (phoneNumber: string, firstName: string, lastName: string) => {
    try {
      // Validate with API
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, firstName, lastName }),
      });

      if (!response.ok) {
        throw new Error('Failed to set session');
      }

      const data = await response.json();

      // Set user in context (also saves to localStorage)
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

  if (isLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900">Side Bet</h1>
            {user && (
              <div className="flex items-center gap-4">
                <a
                  href="/my-bets"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  My Bets
                </a>
                <div className="text-sm text-gray-600">
                  Welcome, {user.firstName}!
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-center mb-6">
                Welcome to Side Bet
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Enter your phone number and name to get started
              </p>
              <PhoneNumberInput onSubmit={handlePhoneSubmit} />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upcoming Games
              </h2>
              <p className="text-gray-600">
                Choose a game to create a bet with your friends
              </p>
            </div>
            <GameList />
          </>
        )}
      </main>
    </div>
  );
}
