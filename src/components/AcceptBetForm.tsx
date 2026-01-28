'use client';

import { useState } from 'react';

interface AcceptBetFormProps {
  maxAmount: number;
  onSubmit: (amount: number) => Promise<void>;
}

export default function AcceptBetForm({ maxAmount, onSubmit }: AcceptBetFormProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const betAmount = parseFloat(amount);

    if (!amount || isNaN(betAmount) || betAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (betAmount > maxAmount) {
      setError(`Amount cannot exceed $${maxAmount}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(betAmount);
    } catch (err) {
      setError('Failed to accept bet. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Your Bet Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            id="amount"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max $${maxAmount}`}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          You can bet up to ${maxAmount}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? 'Accepting Bet...' : 'Accept Bet'}
      </button>
    </form>
  );
}
