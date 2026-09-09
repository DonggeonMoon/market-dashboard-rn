const BASE_URL = 'https://polling.finance.naver.com/api/realtime';

export interface NaverRealtimeItem {
  closePrice: string;
  compareToPreviousClosePrice: string;
  fluctuationsRatio: string;
  compareToPreviousPrice?: {code: string; text: string; name: string};
  fluctuationsType?: {code: string; text: string; name: string};
  localTradedAt: string;
}

interface NaverRealtimeResponse {
  datas: NaverRealtimeItem[];
}

async function fetchRealtime(path: string): Promise<NaverRealtimeItem | null> {
  try {
    const res = await fetch(`${BASE_URL}/${path}`);
    if (!res.ok) return null;
    const json: NaverRealtimeResponse = await res.json();
    return json.datas?.[0] ?? null;
  } catch (e) {
    console.warn(`[naver api] failed: ${path}`, e);
    return null;
  }
}

export const fetchKospi = () => fetchRealtime('domestic/index/KOSPI');
export const fetchKosdaq = () => fetchRealtime('domestic/index/KOSDAQ');
export const fetchSP500 = () => fetchRealtime('worldstock/index/.INX');
export const fetchNasdaq = () => fetchRealtime('worldstock/index/.IXIC');
export const fetchNikkei = () => fetchRealtime('worldstock/index/.N225');
export const fetchSox = () => fetchRealtime('worldstock/index/.SOX');

export const fetchWti = () => fetchRealtime('marketindex/energy/CLcv1');
export const fetchGold = () => fetchRealtime('marketindex/metals/GCcv1');

interface NaverFxResponse {
  country: {value: string; subValue: string; currencyUnit: string}[];
}

async function fetchFx(currencyCode: string): Promise<string | null> {
  const url =
    `https://m.search.naver.com/p/csearch/content/qapirender.nhn` +
    `?key=calculator&pkid=141&q=환율&where=m&u1=keb&u6=standardUnit&u7=0` +
    `&u3=${currencyCode}&u4=KRW&u8=down&u2=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: NaverFxResponse = await res.json();
    return json.country?.[1]?.value ?? null;
  } catch (e) {
    console.warn(`[naver fx api] failed: ${currencyCode}`, e);
    return null;
  }
}

export const fetchUsdKrw = () => fetchFx('USD');
export const fetchJpyKrw = () => fetchFx('JPY');
export const fetchCnyKrw = () => fetchFx('CNY');