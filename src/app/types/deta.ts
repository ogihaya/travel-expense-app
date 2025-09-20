// 人の型定義（TypeScriptで型安全性を確保）
export interface Person {
    id: string;
    name: string;
  }

// 立て替え記録の型定義
export interface Expense {
  id: string;
  payer: string; // 支払い者のID
  beneficiaries: string[]; // 受益者のID配列
  description: string; // 用途
  currency: string; // 通貨コード
  amount: number; // 金額
}

// 通貨の型定義
export interface Currency {
  code: string;
  name: string;
}