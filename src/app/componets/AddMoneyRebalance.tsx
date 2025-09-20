'use client';

import { useState, useEffect } from 'react';
import { Person, Expense, Currency } from '@/app/types/deta';
import { fetchCurrenciesFromAPI } from '@/app/utils/currencyApi';

interface AddMoneyRebalanceProps {
  people: Person[];
}

export default function AddMoneyRebalance({ people }: AddMoneyRebalanceProps) {
  // 状態管理（React Hooks）
  const [expenses, setExpenses] = useState<Expense[]>([]); // 立て替え記録の配列
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダルの開閉状態
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null); // 編集中の記録ID
  const [currencies, setCurrencies] = useState<Currency[]>([]); // 通貨リスト
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false); // 通貨データ読み込み中
  
  // フォームの状態
  const [formData, setFormData] = useState({
    payer: '',
    beneficiaries: [] as string[],
    description: '',
    currency: 'JPY',
    amount: ''
  });
  
  // エラーメッセージ
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // コンポーネントがマウントされた時に通貨データを取得
  useEffect(() => {
    loadCurrencies();
    loadExpensesFromStorage();
  }, []);

  // 通貨データを取得する関数
  const loadCurrencies = async () => {
    setIsLoadingCurrencies(true);
    try {
      const currencyList = await fetchCurrenciesFromAPI();
      setCurrencies(currencyList);
    } catch (error) {
      console.error('通貨データの読み込みに失敗しました:', error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  // ローカルストレージから立て替え記録を読み込む
  const loadExpensesFromStorage = () => {
    try {
      const stored = localStorage.getItem('travel-expenses');
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('立て替え記録の読み込みに失敗しました:', error);
    }
  };

  // ローカルストレージに立て替え記録を保存する
  const saveExpensesToStorage = (newExpenses: Expense[]) => {
    try {
      localStorage.setItem('travel-expenses', JSON.stringify(newExpenses));
    } catch (error) {
      console.error('立て替え記録の保存に失敗しました:', error);
    }
  };

  // フォームのバリデーション
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.payer) {
      newErrors.payer = '支払い者を選択してください';
    }

    if (formData.beneficiaries.length === 0) {
      newErrors.beneficiaries = '受益者を1人以上選択してください';
    }

    if (!formData.description.trim()) {
      newErrors.description = '用途を入力してください';
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = '有効な金額を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 立て替え記録を保存する関数
  const saveExpense = () => {
    if (!validateForm()) {
      return;
    }

    const newExpense: Expense = {
      id: editingExpenseId || Date.now().toString(),
      payer: formData.payer,
      beneficiaries: formData.beneficiaries,
      description: formData.description.trim(),
      currency: formData.currency,
      amount: Number(formData.amount)
    };

    let newExpenses: Expense[];
    if (editingExpenseId) {
      // 編集モード
      newExpenses = expenses.map(expense => 
        expense.id === editingExpenseId ? newExpense : expense
      );
    } else {
      // 新規追加モード
      newExpenses = [...expenses, newExpense];
    }

    setExpenses(newExpenses);
    saveExpensesToStorage(newExpenses);
    closeModal();
  };

  // モーダルを開く関数
  const openModal = (expenseId?: string) => {
    if (expenseId) {
      // 編集モード
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        setFormData({
          payer: expense.payer,
          beneficiaries: expense.beneficiaries,
          description: expense.description,
          currency: expense.currency,
          amount: expense.amount.toString()
        });
        setEditingExpenseId(expenseId);
      }
    } else {
      // 新規追加モード
      setFormData({
        payer: '',
        beneficiaries: [],
        description: '',
        currency: 'JPY',
        amount: ''
      });
      setEditingExpenseId(null);
    }
    setIsModalOpen(true);
    setErrors({});
  };

  // モーダルを閉じる関数
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpenseId(null);
    setFormData({
      payer: '',
      beneficiaries: [],
      description: '',
      currency: 'JPY',
      amount: ''
    });
    setErrors({});
  };

  // 立て替え記録を削除する関数
  const deleteExpense = (id: string) => {
    const newExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(newExpenses);
    saveExpensesToStorage(newExpenses);
  };

  // 人IDから名前を取得する関数
  const getPersonName = (personId: string) => {
    const person = people.find(p => p.id === personId);
    return person ? person.name : '不明';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-3">立て替え管理</h2>
      
      {/* 立て替え追加ボタン */}
      <div className="mb-3">
        <button
          onClick={() => openModal()}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          立て替え追加
        </button>
      </div>

      {/* 立て替え記録一覧 */}
      {expenses.length > 0 ? (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-700">みんなの立て替え ({expenses.length}件)</h3>
          {expenses.map((expense) => (
            <div key={expense.id} className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                {/* 左側: 用途と人情報 */}
                <div className="flex-1 min-w-0">
                  {/* 用途を題名として表示 */}
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                    {expense.description}
                  </h4>
                  
                  {/* 支払い者と受益者をコンパクトに表示 */}
                  <div className="flex items-center gap-3">
                    {/* 支払い者 */}
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {getPersonName(expense.payer)}
                      </span>
                    </div>

                    {/* 矢印アイコン */}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    {/* 受益者（アバターグループ風） */}
                    <div className="flex items-center -space-x-1">
                      {expense.beneficiaries.slice(0, 3).map((beneficiaryId, index) => (
                        <div
                          key={beneficiaryId}
                          className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center border-2 border-white"
                          style={{ zIndex: 10 - index }}
                          title={getPersonName(beneficiaryId)}
                        >
                          <span className="text-xs font-medium text-orange-800">
                            {getPersonName(beneficiaryId).charAt(0)}
                          </span>
                        </div>
                      ))}
                      {/* 4人以上の場合の省略表示 */}
                      {expense.beneficiaries.length > 3 && (
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-xs font-medium text-gray-600">
                            +{expense.beneficiaries.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右側: 金額とアクションボタン */}
                <div className="flex items-center gap-3">
                  {/* 金額表示 */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">
                      {expense.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.currency}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(expense.id)}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>まだ立て替え記録がありません</p>
          <p className="text-sm mt-1">「立て替え追加」ボタンから記録を追加してください</p>
        </div>
      )}

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingExpenseId ? '立て替えを編集' : '立て替えを追加'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); saveExpense(); }} className="space-y-4">
                {/* 支払い者選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支払い者 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.payer}
                    onChange={(e) => setFormData(prev => ({ ...prev, payer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {people.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  {errors.payer && <p className="text-red-500 text-sm mt-1">{errors.payer}</p>}
                </div>

                {/* 受益者選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    受益者 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {people.map(person => (
                      <label key={person.id} className="flex items-center bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.beneficiaries.includes(person.id)}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              beneficiaries: prev.beneficiaries.includes(person.id)
                                ? prev.beneficiaries.filter(id => id !== person.id)
                                : [...prev.beneficiaries, person.id]
                            }));
                          }}
                          className="mr-2 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm whitespace-nowrap">{person.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.beneficiaries && <p className="text-red-500 text-sm mt-1">{errors.beneficiaries}</p>}
                </div>

                {/* 用途入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用途 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="例: 昼食代、電車代、ホテル代"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* 通貨選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    通貨
                  </label>
                  {isLoadingCurrencies ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                      読み込み中...
                    </div>
                  ) : (
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {currencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 金額入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                </div>

                {/* ボタン */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {editingExpenseId ? '更新' : '追加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}