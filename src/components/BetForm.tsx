'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Game } from '@/types';
import { formatSpread } from '@/lib/odds';

interface BetFormProps {
  game: Game;
  userPhone: string;
  userFirstName: string;
  userLastName: string;
  onSubmit: (data: {
    chosenTeam: string;
    chosenTeamId: string;
    pointSpread: number;
    maxAmount: number;
  }) => Promise<void>;
}

export default function BetForm({ game, userPhone, userFirstName, userLastName, onSubmit }: BetFormProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [pointSpread, setPointSpread] = useState<string>(
    game.homeSpread?.toString() || ''
  );
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if official spreads are available
  const hasSpreads = game.homeSpread !== undefined && game.awaySpread !== undefined;
  const spreadIsReadOnly = hasSpreads;

  const handleTeamChange = (team: 'home' | 'away') => {
    setSelectedTeam(team);
    // Auto-populate spread when team changes
    if (team === 'home' && game.homeSpread !== undefined) {
      setPointSpread(game.homeSpread.toString());
    } else if (team === 'away' && game.awaySpread !== undefined) {
      setPointSpread(game.awaySpread.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(maxAmount);
    const spread = parseFloat(pointSpread);

    if (!pointSpread || isNaN(spread)) {
      setError('Please enter a valid point spread');
      return;
    }

    if (!maxAmount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const chosenTeam = selectedTeam === 'home' ? game.homeTeam.name : game.awayTeam.name;
    const chosenTeamId = selectedTeam === 'home' ? game.homeTeam.id : game.awayTeam.id;

    setLoading(true);
    try {
      await onSubmit({
        chosenTeam,
        chosenTeamId,
        pointSpread: spread,
        maxAmount: amount,
      });
    } catch (err) {
      setError('Failed to create bet. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* Game Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-4">
          <span className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
            game.league === 'nfl' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {game.league.toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          {game.awayTeam.name} @ {game.homeTeam.name}
        </h2>
        <p className="text-center text-gray-600">{formattedDate}</p>
      </div>

      {/* Team Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Your Team</h3>
        <div className="space-y-3">
          <label className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            selectedTeam === 'away'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="team"
                value="away"
                checked={selectedTeam === 'away'}
                onChange={() => handleTeamChange('away')}
                className="flex-shrink-0"
              />
              {game.awayTeam.logo && (
                <Image
                  src={game.awayTeam.logo}
                  alt={`${game.awayTeam.name} logo`}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <span className="font-semibold">{game.awayTeam.name}</span>
            </div>
            {game.awaySpread !== undefined && (
              <span className="text-sm font-medium text-gray-700">
                {formatSpread(game.awaySpread)}
              </span>
            )}
          </label>

          <label className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            selectedTeam === 'home'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="team"
                value="home"
                checked={selectedTeam === 'home'}
                onChange={() => handleTeamChange('home')}
                className="flex-shrink-0"
              />
              {game.homeTeam.logo && (
                <Image
                  src={game.homeTeam.logo}
                  alt={`${game.homeTeam.name} logo`}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <span className="font-semibold">{game.homeTeam.name}</span>
            </div>
            {game.homeSpread !== undefined && (
              <span className="text-sm font-medium text-gray-700">
                {formatSpread(game.homeSpread)}
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Bet Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Bet Details</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="spread" className="block text-sm font-medium text-gray-700">
                Point Spread
              </label>
              {spreadIsReadOnly && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Official Spread
                </span>
              )}
            </div>
            <input
              type="number"
              id="spread"
              step="0.5"
              value={pointSpread}
              onChange={(e) => setPointSpread(e.target.value)}
              placeholder="-7.5"
              readOnly={spreadIsReadOnly}
              disabled={spreadIsReadOnly}
              className={`w-full px-4 py-2 border rounded-lg ${
                spreadIsReadOnly
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-700'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {spreadIsReadOnly ? (
              <p className="text-xs text-green-600 mt-1">
                This spread comes from ESPN's betting partners and cannot be modified
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                No official spread available. Enter your own: Negative = favorite (must win by more), Positive = underdog (can lose by less)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Max Bet Amount (per person)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="100.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Each person can bet up to this amount against you
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? 'Creating Bet...' : 'Create Bet'}
      </button>
    </form>
  );
}
