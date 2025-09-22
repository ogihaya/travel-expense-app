'use client';

import { useState, useEffect } from "react";
import { Person, Currency, Expense } from "@/app/types/deta";
import AddPeople from "@/app/componets/AddPeople";
import AddMoneyRebalance from "@/app/componets/AddMoneyRebalance";
import CalculationResult from "@/app/componets/CalculationResult";
import { fetchCurrenciesFromAPI } from "@/app/utils/currencyApi";

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); // 立て替え記録の配列
  const [currencies, setCurrencies] = useState<Currency[]>([]); // 通貨リスト
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false); // 通貨データ読み込み中
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

  // ページが読み込まれた時にローカルストレージからデータを取得
  useEffect(() => {
    loadCurrencies();
    loadExpensesFromStorage();
    try {
      // ローカルストレージからデータを取得
      const savedPeople = localStorage.getItem('travel-people');

      if (savedPeople) {
        // JSON文字列をオブジェクトに変換してpeopleの状態に設定
        const parsedPeople = JSON.parse(savedPeople);
        setPeople(parsedPeople);
        console.log('ローカルストレージから参加者データを復元しました:', parsedPeople);
      }
    } catch (error) {
      console.error('ローカルストレージからのデータ取得に失敗しました:', error);
    }
  }, []); // 空の依存配列で、コンポーネントマウント時に1回だけ実行
  return (
    <div>
      <AddPeople people={people} setPeople={setPeople} />
      <AddMoneyRebalance people={people} currencies={currencies} isLoadingCurrencies={isLoadingCurrencies} expenses={expenses} setExpenses={setExpenses} />
      <CalculationResult expenses={expenses} people={people} currencies={currencies} isLoadingCurrencies={isLoadingCurrencies} />
      <div className="flex justify-center">
      <button onClick={() => {
        const confirm = window.confirm('すべてのデータをリセットしますか？');
        if (!confirm) {
          return;
        }
        // 特定のキーのみを削除
        localStorage.removeItem('travel-expenses');
        localStorage.removeItem('travel-people');
        window.location.reload();
      }}
      className="w-max-2xl mx-auto px-6 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        すべてのデータをリセット
      </button>
      </div>
    </div>
  );
}
