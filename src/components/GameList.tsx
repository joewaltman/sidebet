'use client';

import { useEffect, useState } from 'react';
import GameCard from './GameCard';
import type { Game } from '@/types';

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'nfl' | 'nba'>('all');

  useEffect(() => {
    fetchGames();
  }, [filter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/games' : `/api/games?league=${filter}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data.games);
    } catch (err) {
      setError('Failed to load games. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchGames}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Games
        </button>
        <button
          onClick={() => setFilter('nfl')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'nfl'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          NFL
        </button>
        <button
          onClick={() => setFilter('nba')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'nba'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          NBA
        </button>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No upcoming games found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
