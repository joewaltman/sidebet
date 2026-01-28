'use client';

import type { BetDetails as BetDetailsType } from '@/types';
import { formatSpread } from '@/lib/odds';

interface BetDetailsProps {
  bet: BetDetailsType;
}

export default function BetDetails({ bet }: BetDetailsProps) {
  const gameDate = new Date(bet.gameDate);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const isUpcoming = gameDate.getTime() > Date.now();
  const oppositeSpread = -bet.pointSpread;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Bet Details</h2>

      <div className="space-y-4">
        {/* Game Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Game</h3>
          <p className="text-lg font-semibold">{bet.gameName}</p>
          <p className="text-sm text-gray-600">{formattedDate}</p>
        </div>

        {/* Status Badge */}
        <div>
          <span className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
            bet.status === 'open'
              ? isUpcoming
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {bet.status === 'open' ? (isUpcoming ? 'Open' : 'In Progress') : 'Settled'}
          </span>
        </div>

        {/* Creator Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Created By</h3>
          <p className="text-lg font-semibold">
            {bet.creatorFirstName} {bet.creatorLastName}
          </p>
        </div>

        {/* Bet Info */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Bet Terms</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-600 mb-1">
              {bet.creatorFirstName} picked:
            </p>
            <p className="text-xl font-bold text-blue-900">
              {bet.chosenTeam} {formatSpread(bet.pointSpread)}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">You would be betting:</p>
            <p className="text-xl font-bold text-gray-900">
              Opposite side {formatSpread(oppositeSpread)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {oppositeSpread < 0
                ? `The other team must win by more than ${Math.abs(oppositeSpread)} points`
                : `The other team can lose by up to ${oppositeSpread} points and you still win`}
            </p>
          </div>
        </div>

        {/* Max Amount */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Max Bet (per person)</h3>
          <p className="text-2xl font-bold text-green-600">${bet.maxAmount.toFixed(2)}</p>
        </div>

        {/* Spread Explanation */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">How Point Spreads Work</h4>
          <p className="text-xs text-yellow-800">
            A negative spread means the team is favored and must win by MORE than the spread.
            A positive spread means the team is an underdog and can lose by LESS than the spread (or win outright).
          </p>
        </div>
      </div>
    </div>
  );
}
