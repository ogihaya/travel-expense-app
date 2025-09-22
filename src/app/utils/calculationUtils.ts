// 精算計算のためのユーティリティ関数
import { Person, Expense } from '@/app/types/deta';

// 精算結果の型定義
export interface SettlementResult {
	from: string; // 支払い者のID
	to: string;   // 受取人のID
	amount: number; // 支払い金額
	fromName: string; // 支払い者の名前
	toName: string;   // 受取人の名前
}

// 参加者の支払い状況の型定義
interface PersonBalance {
	id: string;
	name: string;
	totalPaid: number;    // 総支払い額
	totalOwed: number;    // 総負担額
	balance: number;      // 差額（正の値は受取るべき、負の値は支払うべき）
}

// 通貨変換を行う関数
export function convertCurrency(
	amount: number,
	fromCurrency: string,
	toCurrency: string,
	exchangeRates: Record<string, number>
): number {
	// 同じ通貨の場合は変換なし
	if (fromCurrency === toCurrency) {
		return amount;
	}

	// 為替レートを取得（存在しない場合は1を返す）
	const rate = exchangeRates[fromCurrency] || 1;

	// 金額を変換（小数点以下2桁で四捨五入）
	return Math.round(amount / rate * 100) / 100;
}

// 精算計算のメイン関数
export function calculateSettlement(
	participants: Person[],
	expenses: Expense[],
	targetCurrency: string,
	exchangeRates: Record<string, number>
): SettlementResult[] {
	console.log('精算計算を開始します...', {
		participants: participants.length,
		expenses: expenses.length,
		targetCurrency
	});

	// 参加者の支払い状況を初期化
	const balances: PersonBalance[] = participants.map(person => ({
		id: person.id,
		name: person.name,
		totalPaid: 0,
		totalOwed: 0,
		balance: 0
	}));

	// 各支出を処理して参加者の支払い状況を計算
	expenses.forEach(expense => {
		console.log('支出を処理中:', expense);

		// 通貨を変換して記録
		const convertedAmount = convertCurrency(
			expense.amount,
			expense.currency,
			targetCurrency,
			exchangeRates
		);

		// 支払い者の支払い額を記録
		const payer = balances.find(p => p.id === expense.payer);
		if (payer) {
			payer.totalPaid += convertedAmount;
		}

		// 受益者の負担額を計算
		const beneficiaryCount = expense.beneficiaries.length;
		if (beneficiaryCount > 0) {
			const amountPerPerson = convertedAmount / beneficiaryCount;

			expense.beneficiaries.forEach(beneficiaryId => {
				const beneficiary = balances.find(p => p.id === beneficiaryId);
				if (beneficiary) {
					beneficiary.totalOwed += amountPerPerson;
				}
			});
		}
	});

	// 各参加者の差額を計算
	balances.forEach(balance => {
		balance.balance = balance.totalPaid - balance.totalOwed;
		console.log(`${balance.name}: 支払い額=${balance.totalPaid}, 負担額=${balance.totalOwed}, 差額=${balance.balance}`);
	});

	// 精算結果を計算
	const settlements: SettlementResult[] = [];

	// 受取るべき人（正の差額）と支払うべき人（負の差額）を分ける
	const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
	const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

	console.log('受取人:', creditors.map(c => `${c.name}: ${c.balance}`));
	console.log('支払人:', debtors.map(d => `${d.name}: ${d.balance}`));

	// 最小限の精算回数で精算を計算
	let creditorIndex = 0;
	let debtorIndex = 0;

	while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
		const creditor = creditors[creditorIndex];
		const debtor = debtors[debtorIndex];

		// 精算額を計算（小さい方の絶対値）
		const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance));

		if (settlementAmount > 0.01) { // 1銭以上の精算のみ
			settlements.push({
				from: debtor.id,
				to: creditor.id,
				amount: Math.round(settlementAmount * 100) / 100, // 小数点以下2桁で四捨五入
				fromName: debtor.name,
				toName: creditor.name
			});

			// 差額を更新
			creditor.balance -= settlementAmount;
			debtor.balance += settlementAmount;
		}

		// 差額が0に近くなったら次の人に移る
		if (Math.abs(creditor.balance) < 0.01) {
			creditorIndex++;
		}
		if (Math.abs(debtor.balance) < 0.01) {
			debtorIndex++;
		}
	}

	console.log('精算結果:', settlements);
	return settlements;
}

// 精算結果の合計金額を計算する関数
export function calculateTotalSettlementAmount(settlements: SettlementResult[]): number {
	return settlements.reduce((total, settlement) => total + settlement.amount, 0);
}

// 精算結果をフォーマットする関数
export function formatSettlementAmount(amount: number, currency: string): string {
	// 日本円の場合は3桁区切り、その他の通貨は小数点以下2桁
	if (currency === 'JPY') {
		return `¥${amount.toLocaleString('ja-JP')}`;
	} else {
		return `${currency} ${amount.toFixed(2)}`;
	}
}
