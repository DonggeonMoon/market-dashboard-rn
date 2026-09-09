import {StockPrice, StockDetailInfo, StockIndicator, ConsensusInfo, FinancialRow} from '../types/stock';

const BASE_URL = 'https://m.stock.naver.com/front-api/stock/foreign';

const EMPTY_DETAIL: StockDetailInfo = {
  indicator: {},
  overview: [],
  financialYears: [],
  financialRows: [],
  consensus: {},
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[foreign stock] fetch failed: ${url}`, e);
    return null;
  }
}

interface TotalInfoItem {
  code: string;
  value: string;
  valueDesc?: string;
}

interface BasicResult {
  stockExchangeType?: {nameKor?: string};
  currencyType?: {code?: string};
  closePrice: string;
  compareToPreviousClosePrice: string;
  fluctuationsRatio: string;
  compareToPreviousPrice?: {name?: string};
  localTradedAt: string;
  stockItemTotalInfos?: TotalInfoItem[];
}

interface BasicResponse {
  result?: BasicResult;
}

function totalInfoMap(infos?: TotalInfoItem[]): Record<string, TotalInfoItem> {
  const map: Record<string, TotalInfoItem> = {};
  (infos ?? []).forEach(item => {
    map[item.code] = item;
  });
  return map;
}

function fetchBasic(reutersCode: string): Promise<BasicResponse | null> {
  return fetchJson<BasicResponse>(`${BASE_URL}/basic?code=${encodeURIComponent(reutersCode)}&endType=stock`);
}

function toStockPrice(basic: BasicResult): StockPrice {
  const info = totalInfoMap(basic.stockItemTotalInfos);
  const direction = basic.compareToPreviousPrice?.name;
  const currencyCode = basic.currencyType?.code;

  return {
    market: basic.stockExchangeType?.nameKor ?? '',
    closePrice: basic.closePrice,
    changePrice: basic.compareToPreviousClosePrice,
    changeRatio: basic.fluctuationsRatio,
    direction:
      direction === 'RISING' || direction === 'FALLING' || direction === 'UNCHANGED' ? direction : 'UNCHANGED',
    openPrice: info.openPrice?.value ?? '',
    highPrice: info.highPrice?.value ?? '',
    lowPrice: info.lowPrice?.value ?? '',
    volume: info.accumulatedTradingVolume?.value ?? '',
    tradeValue: info.accumulatedTradingValue?.valueDesc ?? info.accumulatedTradingValue?.value ?? '',
    marketCap: info.marketValue?.valueDesc ?? info.marketValue?.value ?? '',
    updatedAt: basic.localTradedAt,
    currencyUnit: currencyCode ? ` ${currencyCode}` : '',
  };
}

export async function fetchForeignStockPrice(reutersCode: string): Promise<StockPrice | null> {
  const json = await fetchBasic(reutersCode);
  if (!json?.result) return null;
  return toStockPrice(json.result);
}

// 일부 종목은 배당 관련 값이 'N/A' 문자열로 내려온다. 나머지 필드처럼 빈 값으로 취급한다.
function orUndefined(value?: string): string | undefined {
  return value && value !== 'N/A' ? value : undefined;
}

function parseIndicator(info: Record<string, TotalInfoItem>): StockIndicator {
  return {
    per: orUndefined(info.per?.value),
    eps: orUndefined(info.eps?.value),
    pbr: orUndefined(info.pbr?.value),
    bps: orUndefined(info.bps?.value),
    dividendYield: orUndefined(info.dividendYieldRatio?.value),
    week52High: orUndefined(info.highPriceOf52Weeks?.value),
    week52Low: orUndefined(info.lowPriceOf52Weeks?.value),
  };
}

interface OverviewResult {
  summary?: string;
}

interface OverviewResponse {
  result?: OverviewResult;
}

function parseOverview(summary?: string): string[] {
  if (!summary) return [];
  return summary
    .split(/<br\s*\/?>/i)
    .map(line => line.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
}

interface ConsensusInfoResult {
  recommMean?: string;
  priceTargetMean?: string;
}

interface IntegrationResult {
  consensusInfo?: ConsensusInfoResult;
}

interface IntegrationResponse {
  result?: IntegrationResult;
}

// 로이터 컨센서스는 1(강력매수)~5(강력매도) 스케일의 평균값만 내려주므로 구간을 나눠 텍스트로 보여준다.
function mapRecommMean(mean?: string): string | undefined {
  if (!mean) return undefined;
  const n = parseFloat(mean);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 1.5) return '강력매수';
  if (n <= 2.5) return '매수';
  if (n <= 3.5) return '중립';
  if (n <= 4.5) return '매도';
  return '강력매도';
}

function parseConsensus(info?: ConsensusInfoResult): ConsensusInfo {
  if (!info) return {};
  return {
    opinion: mapRecommMean(info.recommMean),
    targetPrice: info.priceTargetMean,
  };
}

interface FinanceCell {
  value?: string;
  krw?: string;
}

interface FinanceRowData {
  title: string;
  columns: Record<string, FinanceCell>;
}

interface FinanceTableResult {
  trTitleList?: {key: string; title: string}[];
  rowList?: FinanceRowData[];
}

interface FinanceTableResponse {
  result?: FinanceTableResult;
}

function fetchFinanceTable(reutersCode: string): Promise<FinanceTableResponse | null> {
  return fetchJson<FinanceTableResponse>(
    `${BASE_URL}/stock/finance/table?code=${encodeURIComponent(reutersCode)}&category=ratios&period=annual`,
  );
}

function toEokWon(raw?: string): string | undefined {
  if (!raw) return undefined;
  const num = parseFloat(raw.replace(/,/g, ''));
  if (!Number.isFinite(num)) return undefined;
  return Math.round(num / 100).toLocaleString('ko-KR');
}

function withPercent(raw?: string): string | undefined {
  return raw ? `${raw}%` : undefined;
}

function findRow(rows: FinanceRowData[], title: string): FinanceRowData | undefined {
  return rows.find(row => row.title === title);
}

function parseFinancialRatios(table?: FinanceTableResult): {
  financialYears: string[];
  financialRows: FinancialRow[];
} {
  const titles = table?.trTitleList ?? [];
  const rows = table?.rowList ?? [];
  if (titles.length === 0 || rows.length === 0) {
    return {financialYears: [], financialRows: []};
  }

  const annualKeys = titles.filter(t => t.key !== 'last12month').map(t => t.key).sort();
  const orderedKeys = [...annualKeys, 'last12month'].filter(key => titles.some(t => t.key === key));
  const financialYears = orderedKeys.map(key => (key === 'last12month' ? 'TTM' : key.split('.')[0]));

  const amountRow = (title: string) =>
    orderedKeys.map(key => toEokWon(findRow(rows, title)?.columns[key]?.krw));
  const percentRow = (title: string) =>
    orderedKeys.map(key => withPercent(findRow(rows, title)?.columns[key]?.value));

  const financialRows: FinancialRow[] = [
    {label: '매출액(억)', values: amountRow('매출액')},
    {label: '영업이익(억)', values: amountRow('EBIT')},
    {label: '당기순이익(억)', values: amountRow('당기순이익')},
    {label: '영업이익률', values: percentRow('영업이익마진율')},
    {label: '순이익률', values: percentRow('순이익마진율')},
    {label: 'ROE', values: percentRow('ROE')},
    {label: 'ROA', values: percentRow('ROA')},
    {label: '부채비율', values: percentRow('부채비율')},
  ];

  return {financialYears, financialRows};
}

export async function fetchForeignStockDetailInfo(reutersCode: string): Promise<StockDetailInfo> {
  try {
    const [basicJson, overviewJson, integrationJson, financeJson] = await Promise.all([
      fetchBasic(reutersCode),
      fetchJson<OverviewResponse>(`${BASE_URL}/stock/overview?code=${encodeURIComponent(reutersCode)}`),
      fetchJson<IntegrationResponse>(`${BASE_URL}/integration?code=${encodeURIComponent(reutersCode)}`),
      fetchFinanceTable(reutersCode),
    ]);

    const info = totalInfoMap(basicJson?.result?.stockItemTotalInfos);
    const {financialYears, financialRows} = parseFinancialRatios(financeJson?.result);

    return {
      indicator: parseIndicator(info),
      overview: parseOverview(overviewJson?.result?.summary),
      consensus: parseConsensus(integrationJson?.result?.consensusInfo),
      financialYears,
      financialRows,
    };
  } catch (e) {
    console.warn(`[foreign stock detail] failed: ${reutersCode}`, e);
    return EMPTY_DETAIL;
  }
}
