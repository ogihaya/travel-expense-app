'use client';

import { useState, useCallback } from 'react';
import { Expense, Person, Currency } from "@/app/types/deta";
import { fetchMultipleExchangeRates } from '@/app/utils/currencyApi';
import { 
  calculateSettlement, 
  SettlementResult, 
  formatSettlementAmount,
} from '@/app/utils/calculationUtils';

interface CalculationResultProps {
  expenses: Expense[];
  people: Person[];
  currencies: Currency[];
  isLoadingCurrencies: boolean;
  onCurrencyChange?: (currency: string) => void;
}

export default function CalculationResult({ 
  expenses, 
  people, 
  currencies, 
  isLoadingCurrencies,
  onCurrencyChange 
}: CalculationResultProps) {
  // 状態管理
  const [selectedCurrency, setSelectedCurrency] = useState<string>('JPY');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [settlements, setSettlements] = useState<SettlementResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // 通貨変更ハンドラー
  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    setError(null);
    
    // 親コンポーネントに通知
    if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    }

    // 既に計算済みの場合は、為替レートを適用して再計算
    if (hasCalculated && settlements.length > 0) {
      await recalculateWithNewCurrency(newCurrency);
    }
  }, [hasCalculated, settlements, onCurrencyChange]);

  // 新しい通貨での再計算
  const recalculateWithNewCurrency = async (newCurrency: string) => {
    try {
      setIsCalculating(true);
      
      // 必要な通貨の為替レートを取得
      const uniqueCurrencies = [...new Set(expenses.map(expense => expense.currency))];
      const rates = await fetchMultipleExchangeRates(newCurrency, uniqueCurrencies);
      
      // 精算を再計算
      const newSettlements = calculateSettlement(people, expenses, newCurrency, rates);
      setSettlements(newSettlements);
      
    } catch (err) {
      console.error('再計算に失敗しました:', err);
      setError('通貨変換に失敗しました。もう一度お試しください。');
    } finally {
      setIsCalculating(false);
    }
  };

  // 精算計算の実行
  const handleCalculate = async () => {
    if (people.length === 0) {
      setError('参加者が登録されていません。');
      return;
    }

    if (expenses.length === 0) {
      setError('支出記録がありません。');
      return;
    }

    try {
      setIsCalculating(true);
      setError(null);

      // 必要な通貨の為替レートを取得
      const uniqueCurrencies = [...new Set(expenses.map(expense => expense.currency))];
      const rates = await fetchMultipleExchangeRates(selectedCurrency, uniqueCurrencies);

      // 精算を計算
      const newSettlements = calculateSettlement(people, expenses, selectedCurrency, rates);
      setSettlements(newSettlements);
      setHasCalculated(true);

      console.log('精算計算が完了しました:', newSettlements);

    } catch (err) {
      console.error('精算計算に失敗しました:', err);
      setError('精算計算に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setIsCalculating(false);
    }
  };

  // 精算結果の表示
  const renderSettlements = () => {
    if (settlements.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>精算結果がありません。</p>
          <p className="text-sm mt-2">すべての支払いが均等に分担されています。</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          精算結果
        </h3>
        {settlements.map((settlement, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-orange-800 bg-orange-100 text-sm border border-orange-200 rounded-full px-2 py-1">{settlement.fromName}</span>
                <span className="text-gray-400">→</span>
                <span className="text-orange-800 bg-orange-100 text-sm border border-orange-200 rounded-full px-2 py-1">{settlement.toName}</span>
              </div>
              <span className="text-lg font-semibold text-orange-500">
                {formatSettlementAmount(settlement.amount, selectedCurrency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-3">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          精算計算
        </h2>
        <p className="text-gray-600">
          旅行費用を均等に分担し、精算が必要な金額を計算します。
        </p>
      </div>

      {/* 通貨選択と計算ボタン */}
      <div className="mb-6">
        <div className="">
          {/* 計算ボタン */}
          <button
            onClick={handleCalculate}
            disabled={isCalculating || isLoadingCurrencies || people.length === 0 || expenses.length === 0}
            className="w-full px-6 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCalculating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>計算中...</span>
              </div>
            ) : (
              hasCalculated ? '再計算' : '精算計算'
            )}
          </button>

           {/* 通貨選択 */}
           <div className="mt-4">
            <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-2">
              表示通貨
            </label>
            <select
              id="currency-select"
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              disabled={isLoadingCurrencies || isCalculating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {isLoadingCurrencies ? (
                <option value="">通貨を読み込み中...</option>
              ) : (
                currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 精算結果 */}
      {hasCalculated && !isCalculating && (
        <div className="mt-6">
          {renderSettlements()}
        </div>
      )}

      {/* 計算前の状態表示 */}
      {!hasCalculated && !isCalculating && (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">精算計算を開始</p>
          <p className="text-sm">
            参加者と支出記録を登録したら、<br />
            「精算計算」ボタンをクリックしてください。
          </p>
        </div>
      )}
    </div>
  );
}