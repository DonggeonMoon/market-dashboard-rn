import {ECOS_API_KEY} from '@env';

const BASE_URL = 'https://ecos.bok.or.kr/api/StatisticSearch';
const STAT_CODE = '902Y006';

export interface EcosRow {
  TIME: string;
  DATA_VALUE: string;
  ITEM_NAME1: string;
}

interface EcosResponse {
  StatisticSearch?: {
    row: EcosRow[];
  };
  RESULT?: {
    CODE: string;
    MESSAGE: string;
  };
}

function getYearMonthRange(): {start: string; end: string} {
  const now = new Date();
  const end = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const start = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  return {start, end};
}

async function fetchBaseRate(countryCode: string): Promise<EcosRow | null> {
  const {start, end} = getYearMonthRange();
  const url = `${BASE_URL}/${ECOS_API_KEY}/json/kr/1/12/${STAT_CODE}/M/${start}/${end}/${countryCode}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: EcosResponse = await res.json();
    const rows = json.StatisticSearch?.row;
    if (!rows || rows.length === 0) return null;
    return rows[rows.length - 1];
  } catch (e) {
    console.warn(`[ecos api] failed: ${countryCode}`, e);
    return null;
  }
}

export const fetchKoreaRate = () => fetchBaseRate('KR');
export const fetchUsRate = () => fetchBaseRate('US');
export const fetchJapanRate = () => fetchBaseRate('JP');

export function formatEcosTime(time: string): string {
  const year = time.slice(0, 4);
  const month = time.slice(4, 6);
  return `${year}-${month}`;
}