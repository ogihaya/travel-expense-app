import { NextRequest, NextResponse } from 'next/server';

// GET /api/exchange-rates - 為替レートを取得するAPIエンドポイント
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const currencies = searchParams.get('currencies');

    if (!from) {
      return NextResponse.json({ error: 'from通貨が指定されていません' }, { status: 400 });
    }

    // サーバーサイドで環境変数からAPIキーを取得
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    
    if (!apiKey) {
      console.error('EXCHANGE_RATE_API_KEYが設定されていません');
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 500 });
    }

    let response;
    let apiUrl;

    if (to) {
      // 単一通貨の為替レート取得
      apiUrl = `https://api.exchangerate.host/convert?apikey=${apiKey}&from=${from}&to=${to}&amount=1`;
      console.log(`単一為替レート取得: ${from} -> ${to}`);
    } else if (currencies) {
      // 複数通貨の為替レート取得
      apiUrl = `https://api.exchangerate.host/live?access_key=${apiKey}&source=${from}&currencies=${currencies}`;
      console.log(`複数為替レート取得: ${from} -> ${currencies}`);
    } else {
      return NextResponse.json({ error: 'to通貨またはcurrenciesが指定されていません' }, { status: 400 });
    }

    response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('為替レートの取得に成功しました');
      return NextResponse.json(data);
    } else {
      throw new Error(data.error?.info || '為替レートの取得に失敗しました');
    }
  } catch (error) {
    console.error('為替レート取得エラー:', error);
    return NextResponse.json({ 
      error: '為替レートの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
