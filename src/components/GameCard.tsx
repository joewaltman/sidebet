'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/types';
import { formatSpread } from '@/lib/odds';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const hasSpreads = game.homeSpread !== undefined && game.awaySpread !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* League Badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
          game.league === 'nfl' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {game.league.toUpperCase()}
        </span>
        <div className="text-right text-sm text-gray-600">
          <div>{formattedDate}</div>
          <div>{formattedTime}</div>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {game.awayTeam.logo && (
              <Image
                src={game.awayTeam.logo}
                alt={`${game.awayTeam.name} logo`}
                width={32}
                height={32}
                className="object-contain"
              />
            )}
            <div className="font-semibold text-lg">{game.awayTeam.name}</div>
          </div>
          {hasSpreads && (
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {formatSpread(game.awaySpread!)}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {game.homeTeam.logo && (
              <Image
                src={game.homeTeam.logo}
                alt={`${game.homeTeam.name} logo`}
                width={32}
                height={32}
                className="object-contain"
              />
            )}
            <div className="font-semibold text-lg">{game.homeTeam.name}</div>
          </div>
          {hasSpreads && (
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {formatSpread(game.homeSpread!)}
            </div>
          )}
        </div>
      </div>

      {/* Create Bet Button */}
      <Link
        href={`/create?gameId=${game.id}&league=${game.league}`}
        className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Bet on this game
      </Link>

      {!hasSpreads && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Spreads not available - you can set your own
        </p>
      )}
    </div>
  );
}
