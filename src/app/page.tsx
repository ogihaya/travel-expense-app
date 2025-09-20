'use client';

import { useState, useEffect } from "react";
import { Person } from "@/app/types/deta";
import AddPeople from "@/app/componets/AddPeople";
import AddMoneyRebalance from "@/app/componets/AddMoneyRebalance";
import CalculationResult from "@/app/componets/CalculationResult";

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);

   // ページが読み込まれた時にローカルストレージからデータを取得
   useEffect(() => {
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
      <AddMoneyRebalance people={people} />
      <CalculationResult />
    </div>
  );
}
