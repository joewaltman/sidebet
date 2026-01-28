'use client';

import Link from 'next/link';
import { formatSpread } from '@/lib/odds';

interface MyBetCardProps {
  betId: string;
  gameName: string;
  gameDate: string;
  chosenTeam: string;
  pointSpread: number;
  amount: number;
  status: 'open' | 'settled';
  isCreator: boolean;
  result?: {
    winningTeamId: string;
    homeScore: number;
    awayScore: number;
  } | null;
  chosenTeamId?: string;
}

export default function MyBetCard({
  betId,
  gameName,
  gameDate,
  chosenTeam,
  pointSpread,
  amount,
  status,
  isCreator,
  result,
  chosenTeamId,
}: MyBetCardProps) {
  const gameDateTime = new Date(gameDate);
  const formattedDate = gameDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = gameDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isUpcoming = gameDateTime.getTime() > Date.now();

  // Determine win/loss for settled bets
  let outcome: 'win' | 'loss' | 'push' | null = null;
  if (status === 'settled' && result && chosenTeamId) {
    if (!result.winningTeamId) {
      outcome = 'push';
    } else {
      const creatorWon = result.winningTeamId === chosenTeamId;
      outcome = isCreator ? (creatorWon ? 'win' : 'loss') : (creatorWon ? 'loss' : 'win');
    }
  }

  return (
    <Link href={`/bet/${betId}`}>
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Header with status badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{gameName}</h3>
            <p className="text-sm text-gray-600">
              {formattedDate} at {formattedTime}
            </p>
          </div>
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
              status === 'open'
                ? isUpcoming
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {status === 'open' ? (isUpcoming ? 'Open' : 'In Progress') : 'Settled'}
          </span>
        </div>

        {/* Bet details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {isCreator ? 'Your pick:' : 'Betting against:'}
            </span>
            <span className="font-medium text-gray-900">
              {chosenTeam} {formatSpread(pointSpread)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-semibold text-lg text-gray-900">${amount.toFixed(2)}</span>
          </div>

          {/* Show result for settled bets */}
          {status === 'settled' && result && outcome && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Final Score:</span>
                <span className="text-sm font-medium text-gray-900">
                  {result.homeScore} - {result.awayScore}
                </span>
              </div>
              <div className="mt-2">
                {outcome === 'push' ? (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                    Push - No Winner
                  </span>
                ) : outcome === 'win' ? (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    You Won! +${amount.toFixed(2)}
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    You Lost -${amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role indicator */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {isCreator ? 'Bet Created by You' : 'Bet Accepted by You'}
          </span>
        </div>
      </div>
    </Link>
  );
}
