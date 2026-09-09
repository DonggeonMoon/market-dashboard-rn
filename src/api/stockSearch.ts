import {StockSummary} from '../types/stock';

const SEARCH_URL = 'https://m.stock.naver.com/front-api/search/autoComplete';

interface AutoCompleteItem {
  code: string;
  name: string;
  typeName: string;
  isEtf: boolean;
}

interface AutoCompleteResponse {
  result?: {items?: AutoCompleteItem[]};
}

export async function fetchStockSearch(query: string): Promise<StockSummary[]> {
  const keyword = query.trim();
  if (!keyword) return [];

  try {
    const url = `${SEARCH_URL}?query=${encodeURIComponent(keyword)}&target=stock`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json: AutoCompleteResponse = await res.json();
    const items = json.result?.items ?? [];
    return items
      .filter(item => !item.isEtf)
      .map(item => ({code: item.code, name: item.name, market: item.typeName}));
  } catch (e) {
    console.warn(`[stock search] failed: ${query}`, e);
    return [];
  }
}
