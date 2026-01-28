'use client';

import type { BetResult, IOU } from '@/types';

interface BetStatusProps {
  result: BetResult;
  ious: IOU[];
  userPhone: string;
  chosenTeam: string;
  chosenTeamId: string;
  pointSpread: number;
}

export default function BetStatus({ result, ious, userPhone, chosenTeam, chosenTeamId, pointSpread }: BetStatusProps) {
  const isPush = !result.winningTeamId;
  const creatorWon = result.winningTeamId === chosenTeamId;

  // Find IOUs relevant to current user
  const userIous = ious.filter(
    (iou) => iou.debtor.toLowerCase().includes(userPhone) || iou.creditor.toLowerCase().includes(userPhone)
  );

  const pointDiff = Math.abs(result.homeScore - result.awayScore);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Bet Result</h2>

      {/* Game Result */}
      <div className="mb-6 text-center">
        <div className="text-lg font-semibold mb-2">Final Score</div>
        <div className="text-3xl font-bold text-gray-900">
          {result.homeScore} - {result.awayScore}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Point difference: {pointDiff}
        </div>
      </div>

      {/* Outcome Banner */}
      {isPush ? (
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">PUSH</div>
          <p className="text-gray-700">
            The point differential exactly matched the spread. No money changes hands.
          </p>
        </div>
      ) : (
        <div className={`border-2 rounded-lg p-6 mb-6 text-center ${
          creatorWon
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className={`text-2xl font-bold mb-2 ${
            creatorWon ? 'text-green-900' : 'text-red-900'
          }`}>
            {creatorWon ? 'Bet Won!' : 'Bet Lost'}
          </div>
          <p className={creatorWon ? 'text-green-700' : 'text-red-700'}>
            {chosenTeam} {creatorWon ? 'covered' : 'did not cover'} the {pointSpread > 0 ? '+' : ''}{pointSpread} spread
          </p>
        </div>
      )}

      {/* IOUs */}
      {!isPush && ious.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold mb-4">IOUs</h3>
          <div className="space-y-3">
            {ious.map((iou, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-semibold">{iou.debtor}</span>
                  <span className="text-gray-600"> owes </span>
                  <span className="font-semibold">{iou.creditor}</span>
                </div>
                <div className="text-xl font-bold text-green-600">
                  ${iou.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* User-specific summary */}
          {userIous.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Your Summary</h4>
              {userIous.map((iou, index) => (
                <p key={index} className="text-blue-800">
                  {iou.debtor.toLowerCase().includes(userPhone)
                    ? `You owe ${iou.creditor} $${iou.amount.toFixed(2)}`
                    : `${iou.debtor} owes you $${iou.amount.toFixed(2)}`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
