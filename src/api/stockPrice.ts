import {StockPrice} from '../types/stock';

const PRICE_URL = 'https://polling.finance.naver.com/api/realtime/domestic/stock';

interface NaverStockRealtimeItem {
  stockExchangeType?: {nameKor?: string};
  closePrice: string;
  compareToPreviousClosePrice: string;
  fluctuationsRatio: string;
  compareToPreviousPrice?: {name?: string};
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  accumulatedTradingVolume: string;
  accumulatedTradingValue: string;
  marketValueFullRaw: string | number;
  localTradedAt: string;
}

interface NaverStockRealtimeResponse {
  datas: NaverStockRealtimeItem[];
}

function formatMarketCap(raw: string | number): string {
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!Number.isFinite(num)) return '';
  const eok = Math.round(num / 100_000_000);
  return `${eok.toLocaleString('ko-KR')}억원`;
}

export async function fetchStockPrice(code: string): Promise<StockPrice | null> {
  try {
    const res = await fetch(`${PRICE_URL}/${code}`);
    if (!res.ok) return null;
    const json: NaverStockRealtimeResponse = await res.json();
    const item = json.datas?.[0];
    if (!item) return null;

    const direction = item.compareToPreviousPrice?.name;
    return {
      market: item.stockExchangeType?.nameKor ?? '',
      closePrice: item.closePrice,
      changePrice: item.compareToPreviousClosePrice,
      changeRatio: item.fluctuationsRatio,
      direction:
        direction === 'RISING' || direction === 'FALLING' || direction === 'UNCHANGED'
          ? direction
          : 'UNCHANGED',
      openPrice: item.openPrice,
      highPrice: item.highPrice,
      lowPrice: item.lowPrice,
      volume: item.accumulatedTradingVolume,
      tradeValue: item.accumulatedTradingValue,
      marketCap: formatMarketCap(item.marketValueFullRaw),
      updatedAt: item.localTradedAt,
    };
  } catch (e) {
    console.warn(`[stock price] failed: ${code}`, e);
    return null;
  }
}
