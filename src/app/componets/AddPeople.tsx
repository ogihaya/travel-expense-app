'use client';

import { useState, useEffect } from 'react';
import { Person } from '@/app/types/deta';

export default function AddPeople() {
  // 状態管理（React Hooks）
  const [people, setPeople] = useState<Person[]>([]); // 追加された人のリスト
  const [inputName, setInputName] = useState(''); // 入力フィールドの値
  const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ

  // コンポーネントがマウントされた時にローカルストレージからデータを読み込み
  useEffect(() => {
    const savedPeople = localStorage.getItem('travel-people');
    if (savedPeople) {
      try {
        setPeople(JSON.parse(savedPeople));
      } catch (error) {
        console.error('ローカルストレージからのデータ読み込みに失敗しました:', error);
      }
    }
  }, []);

  // ローカルストレージにデータを保存する関数
  const saveToLocalStorage = (newPeople: Person[]) => {
    try {
      localStorage.setItem('travel-people', JSON.stringify(newPeople));
    } catch (error) {
      console.error('ローカルストレージへの保存に失敗しました:', error);
    }
  };

  // 人を追加する関数
  const addPerson = () => {
    const trimmedName = inputName.trim(); // 前後の空白を削除
    
    // バリデーション（入力チェック）
    if (!trimmedName) {
      setErrorMessage('名前を入力してください');
      return;
    }

    // 重複チェック（同じ名前の人が既に存在するかチェック）
    const isDuplicate = people.some(person => 
      person.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      setErrorMessage('この名前は既に追加されています');
      return;
    }

    // 新しい人を作成
    const newPerson: Person = {
      id: Date.now().toString(), // 簡単なID生成（現在のタイムスタンプ）
      name: trimmedName
    };

    // 状態を更新
    const newPeople = [...people, newPerson];
    setPeople(newPeople);
    
    // ローカルストレージに保存
    saveToLocalStorage(newPeople);
    
    // 入力フィールドをクリアしてエラーメッセージをリセット
    setInputName('');
    setErrorMessage('');
  };

  // 人を削除する関数
  const removePerson = (id: string) => {
    const newPeople = people.filter(person => person.id !== id);
    setPeople(newPeople);
    saveToLocalStorage(newPeople);
  };

  // Enterキーで追加できるようにする
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputName.trim()) {
      addPerson();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-3">旅行参加者を追加</h2>
      
      {/* 入力フィールドと追加ボタン */}
      <div className="flex gap-3 mb-2">
        <input
          type="text"
          value={inputName}
          onChange={(e) => {
            setInputName(e.target.value);
            setErrorMessage(''); // 入力時にエラーメッセージをクリア
          }}
          onKeyPress={handleKeyPress}
          placeholder="参加者の名前を入力してください"
          className="flex-1 px-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <button
          onClick={addPerson}
          disabled={!inputName.trim()} // 入力欄が空の時はボタンを無効化
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            inputName.trim()
              ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          追加
        </button>
      </div>

      {/* エラーメッセージ表示 */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* 追加された人のリスト（トークン表示） */}
      {people.length > 0 && (
        <div className="mt-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            参加者一覧 ({people.length}人)
          </h3>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200"
              >
                <span className="text-sm font-medium">{person.name}</span>
                <button
                  onClick={() => removePerson(person.id)}
                  className="text-orange-600 hover:text-orange-800 hover:bg-orange-200 rounded-full p-1 transition-colors"
                  title="削除"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 参加者がいない場合のメッセージ */}
      {people.length === 0 && (
        <div className="text-center text-gray-500 py-2">
          <p>まだ参加者が追加されていません</p>
          <p className="text-sm mt-1">上記の入力欄から参加者を追加してください</p>
        </div>
      )}
    </div>
  );
}