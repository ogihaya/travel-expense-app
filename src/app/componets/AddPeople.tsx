'use client';

import { useState } from 'react';
import { Person, Expense } from '@/app/types/deta';

interface AddPeopleProps {
  people: Person[];
  setPeople: (people: Person[]) => void;
}

export default function AddPeople({ people, setPeople }: AddPeopleProps) {
  // 状態管理（React Hooks）
  const [inputName, setInputName] = useState(''); // 入力フィールドの値
  const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ
  const [editingId, setEditingId] = useState<string | null>(null); // 編集中の人のID
  const [editingName, setEditingName] = useState(''); // 編集中の名前

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

  // 立て替え記録から人を削除できるかチェックする関数
  const canRemovePerson = (personId: string): { canRemove: boolean; reason?: string } => {
    try {
      // ローカルストレージから立て替え記録を取得
      const stored = localStorage.getItem('travel-expenses');
      if (!stored) {
        return { canRemove: true }; // 立て替え記録がなければ削除可能
      }

      const expenses: Expense[] = JSON.parse(stored);
      
      // 支払い者として使用されているかチェック
      const isPayer = expenses.some(expense => expense.payer === personId);
      if (isPayer) {
        return { 
          canRemove: false, 
          reason: 'この人は立て替え記録の支払い者として登録されているため削除できません。まず該当する立て替え記録を削除してください。' 
        };
      }

      // 受益者として使用されているかチェック
      const isBeneficiary = expenses.some(expense => 
        expense.beneficiaries.includes(personId)
      );
      if (isBeneficiary) {
        return { 
          canRemove: false, 
          reason: 'この人は立て替え記録の受益者として登録されているため削除できません。まず該当する立て替え記録を削除してください。' 
        };
      }

      return { canRemove: true };
    } catch (error) {
      console.error('立て替え記録のチェック中にエラーが発生しました:', error);
      return { canRemove: true }; // エラーの場合は削除を許可
    }
  };

  // 人を削除する関数
  const removePerson = (id: string) => {
    // 削除前にチェックを実行
    const checkResult = canRemovePerson(id);
    
    if (!checkResult.canRemove) {
      setErrorMessage(checkResult.reason || 'この人を削除できません');
      return;
    }

    // チェックが通った場合のみ削除を実行
    const newPeople = people.filter(person => person.id !== id);
    setPeople(newPeople);
    saveToLocalStorage(newPeople);
    setErrorMessage(''); // エラーメッセージをクリア
  };

  // 編集モードを開始する関数
  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    setErrorMessage(''); // エラーメッセージをクリア
  };

  // 編集をキャンセルする関数
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setErrorMessage('');
  };

  // 名前を更新する関数
  const updatePersonName = () => {
    const trimmedName = editingName.trim();

    // バリデーション（入力チェック）
    if (!trimmedName) {
      setErrorMessage('名前を入力してください');
      return;
    }

    // 重複チェック（編集中の人以外で同じ名前が存在するかチェック）
    const isDuplicate = people.some(person =>
      person.id !== editingId &&
      person.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage('この名前は既に使用されています');
      return;
    }

    // 名前を更新
    const newPeople = people.map(person =>
      person.id === editingId
        ? { ...person, name: trimmedName }
        : person
    );

    setPeople(newPeople);
    saveToLocalStorage(newPeople);

    // 編集モードを終了
    setEditingId(null);
    setEditingName('');
    setErrorMessage('');
  };

  // Enterキーで追加できるようにする
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputName.trim()) {
      addPerson();
    }
  };

  // Enterキーで編集を確定できるようにする
  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingName.trim()) {
      updatePersonName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 shadow-lg rounded-lg mb-3">
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
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${inputName.trim()
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
                className="flex items-center gap-4 bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200"
              >
                {/* 編集モードの場合は入力欄、そうでなければ名前を表示 */}
                {editingId === person.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={handleEditKeyPress}
                    className="text-sm font-medium bg-white border border-orange-300 rounded px-2 py-1 min-w-0 flex-1"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium">{person.name}</span>
                )}
                <div>
                  {/* 編集モードの場合は保存・キャンセルボタン、そうでなければ編集・削除ボタン */}
                  {editingId === person.id ? (
                    <>
                      <button
                        onClick={updatePersonName}
                        className="text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-1 transition-colors"
                        title="保存"
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full p-1 transition-colors"
                        title="キャンセル"
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
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(person.id, person.name)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-1 transition-colors"
                        title="編集"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
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
                    </>
                  )}
                </div>
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