// 通貨データを取得するためのAPI関数
import { Currency } from '@/app/types/deta';

// 主要通貨のフォールバックデータ（定数として定義）
const FALLBACK_CURRENCIES: Currency[] = [
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'SGD', name: 'Singapore Dollar' }
];

// 最小限のフォールバック通貨（ネットワークエラー時用）
const MINIMAL_FALLBACK_CURRENCIES: Currency[] = [
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'AUD', name: 'Australian Dollar' }
];

// フォールバック通貨のコードセットを作成（高速検索用）
const FALLBACK_CURRENCY_CODES = new Set(FALLBACK_CURRENCIES.map(currency => currency.code));

// 通貨リストをフォールバック通貨優先でソートする関数
function sortCurrenciesByFallbackPriority(currencies: Currency[]): Currency[] {
  return [...currencies].sort((a, b) => {
    const aIsFallback = FALLBACK_CURRENCY_CODES.has(a.code);
    const bIsFallback = FALLBACK_CURRENCY_CODES.has(b.code);
    
    // フォールバック通貨を先頭に配置
    if (aIsFallback && !bIsFallback) {
      return -1; // aを先頭に
    }
    if (!aIsFallback && bIsFallback) {
      return 1; // bを先頭に
    }
    
    // 両方ともフォールバック通貨、または両方ともそうでない場合
    if (aIsFallback && bIsFallback) {
      // フォールバック通貨内では元の順序を維持
      const aIndex = FALLBACK_CURRENCIES.findIndex(c => c.code === a.code);
      const bIndex = FALLBACK_CURRENCIES.findIndex(c => c.code === b.code);
      return aIndex - bIndex;
    }
    
    // どちらもフォールバック通貨でない場合は通貨コードでアルファベット順
    return a.code.localeCompare(b.code);
  });
}

// クライアントサイドから通貨データを取得する関数（APIルート経由）
export async function fetchCurrenciesFromAPI(): Promise<Currency[]> {
  try {
    console.log('APIルートから通貨データを取得中...');
    
    const response = await fetch('/api/currencies');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const currencies = await response.json();
    console.log(`${currencies.length}個の通貨データを取得しました`);
    
    return sortCurrenciesByFallbackPriority(currencies);
  } catch (error) {
    console.error('通貨データの取得に失敗しました:', error);
    
    // エラー時は主要通貨を返す
    return FALLBACK_CURRENCIES;
  }
}

// exchangerate.host APIから通貨リストを取得する関数（サーバーサイド用）
export async function fetchCurrencies(): Promise<Currency[]> {
  try {
    // 環境変数からAPIキーを取得
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    
    const response = await fetch(
      `https://api.exchangerate.host/list?access_key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // APIレスポンスから通貨リストを抽出
    if (data.success && data.currencies) {
      return Object.entries(data.currencies).map(([code, name]) => ({
        code,
        name: name as string
      }));
    }
    
    // フォールバック: 主要通貨を返す
    return FALLBACK_CURRENCIES;
  } catch (error) {
    console.error('通貨データの取得に失敗しました:', error);
    
    // エラー時は最小限の通貨を返す
    return MINIMAL_FALLBACK_CURRENCIES;
  }
}

// フォールバック通貨を取得する関数（他のファイルからも使用可能）
export function getFallbackCurrencies(): Currency[] {
  return FALLBACK_CURRENCIES;
}

export function getMinimalFallbackCurrencies(): Currency[] {
  return MINIMAL_FALLBACK_CURRENCIES;
}

// 為替レート取得のための型定義
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

// 為替レートを取得する関数（APIルート経由）
export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  try {
    console.log(`${from}から${to}への為替レートを取得中...`);

    // サーバーサイドのAPIルート経由で為替レートを取得
    const response = await fetch(`/api/exchange-rates?from=${from}&to=${to}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.result) {
      console.log(`${from}から${to}への為替レート: ${data.result}`);
      return data.result;
    }
    
    throw new Error('為替レートの取得に失敗しました');
  } catch (error) {
    console.error('為替レートの取得に失敗しました:', error);
    
    // エラー時は1を返す（変換なし）
    return 1;
  }
}

// 複数の通貨ペアの為替レートを一括取得する関数（APIルート経由）
export async function fetchMultipleExchangeRates(
  from: string, 
  toCurrencies: string[]
): Promise<Record<string, number>> {
  try {
    console.log(`${from}から複数通貨への為替レートを取得中...`);

    // 複数の通貨をカンマ区切りで指定
    const currencies = toCurrencies.join(',');
    
    // サーバーサイドのAPIルート経由で為替レートを取得
    const response = await fetch(`/api/exchange-rates?from=${from}&currencies=${currencies}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.quotes) {
      const rates: Record<string, number> = {};
      
      // レスポンスから為替レートを抽出
      Object.entries(data.quotes).forEach(([key, value]) => {
        const currency = key.replace(from, ''); // "USDJPY" -> "JPY"
        rates[currency] = value as number;
      });
      
      console.log(`${Object.keys(rates).length}個の為替レートを取得しました`);
      
      return rates;
    }
    
    throw new Error('為替レートの取得に失敗しました');
  } catch (error) {
    console.error('複数為替レートの取得に失敗しました:', error);
    
    // エラー時は全て1を返す（変換なし）
    const rates: Record<string, number> = {};
    toCurrencies.forEach(currency => {
      rates[currency] = 1;
    });
    return rates;
  }
}