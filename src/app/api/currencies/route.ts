import { NextResponse } from 'next/server';
import { fetchCurrencies, getFallbackCurrencies } from '@/app/utils/currencyApi';

// GET /api/currencies - 通貨リストを取得するAPIエンドポイント
export async function GET() {
  try {
    console.log('通貨データの取得を開始します...');
    
    // サーバーサイドで通貨データを取得
    const currencies = await fetchCurrencies();
    
    console.log(`${currencies.length}個の通貨データを取得しました`);
    
    return NextResponse.json(currencies);
  } catch (error) {
    console.error('通貨データの取得に失敗しました:', error);
    
    // エラー時は主要通貨を返す
    const fallbackCurrencies = getFallbackCurrencies();
    
    return NextResponse.json(fallbackCurrencies);
  }
}