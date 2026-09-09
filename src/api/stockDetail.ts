import {StockDetailInfo, StockIndicator, ConsensusInfo, FinancialRow} from '../types/stock';

const MAIN_URL = 'https://navercomp.wisereport.co.kr/v2/company/c1010001.aspx';
// 메인 페이지의 재무비율 표는 빈 <div>로만 내려오고, 실제 값은 이 주소를 따로 호출해야 채워진다.
const RATIO_URL = 'https://navercomp.wisereport.co.kr/company/ajax/cF1001.aspx';

const EMPTY_DETAIL: StockDetailInfo = {
  indicator: {},
  overview: [],
  financialYears: [],
  financialRows: [],
  consensus: {},
};

async function fetchText(url: string, headers?: Record<string, string>): Promise<string> {
  try {
    const res = await fetch(url, headers ? {headers} : undefined);
    if (!res.ok) return '';
    return await res.text();
  } catch (e) {
    console.warn(`[stock detail] fetch failed: ${url}`, e);
    return '';
  }
}

function clean(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 재무비율 표를 채우려면 페이지마다 새로 발급되는 인증 토큰(encparam)이 필요하다.
function extractEncParam(html: string): string | undefined {
  const m = html.match(/encparam:\s*'([^']+)'/);
  return m ? m[1] : undefined;
}

function orUndefined(value?: string): string | undefined {
  return value && value !== 'N/A' ? value : undefined;
}

function extractDigestValue(html: string, label: string): string | undefined {
  const re = new RegExp(`>${label}\\s*<b class="num">([^<]*)</b>`);
  const m = html.match(re);
  return orUndefined(m ? m[1].trim() : undefined);
}

function extractFundamentalEstimate(html: string, label: string): string | undefined {
  const re = new RegExp(
    `<th class="left" scope="row">${label}</th>\\s*<td class="num">[^<]*</td>\\s*<td class="num[^"]*">([^<]*)</td>`,
  );
  const m = html.match(re);
  return orUndefined(m ? m[1].replace(/원$/, '').trim() : undefined);
}

function extractLabeledCell(html: string, label: string): string | undefined {
  const re = new RegExp(`<th scope="row" class="txt[^"]*">${label}[^<]*</th>\\s*<td class="num">([\\s\\S]*?)</td>`);
  const m = html.match(re);
  return m ? clean(m[1]) : undefined;
}

function parseIndicator(html: string): StockIndicator {
  const week52 = extractLabeledCell(html, '52Weeks 최고/최저');
  const [week52High, week52Low] = week52 ? week52.split('/').map(s => s.trim()) : [undefined, undefined];

  return {
    per: extractDigestValue(html, 'PER'),
    eps: extractDigestValue(html, 'EPS'),
    pbr: extractDigestValue(html, 'PBR'),
    bps: extractDigestValue(html, 'BPS'),
    dividendYield: extractDigestValue(html, '현금배당수익률'),
    estimatedPer: extractFundamentalEstimate(html, 'PER'),
    estimatedEps: extractFundamentalEstimate(html, 'EPS'),
    marketCap: extractLabeledCell(html, '시가총액'),
    week52High,
    week52Low,
    foreignRatio: extractLabeledCell(html, '외국인지분율'),
  };
}

function parseOverview(html: string): string[] {
  const section = html.match(/<div class="cmp_comment">([\s\S]*?)<\/div>/);
  if (!section) return [];
  const items = [...section[1].matchAll(/<li class="dot_cmp"[^>]*>([^<]*)<\/li>/g)];
  return items.map(m => m[1].trim()).filter(Boolean);
}

function parseConsensus(html: string): ConsensusInfo {
  const idx = html.indexOf('id="cTB15"');
  if (idx === -1) return {};
  const slice = html.slice(idx, idx + 4000);
  const m = slice.match(
    /<td class="noline-bottom line-right center[^"]*">\s*<b>([^<]*)<\/b>\s*<\/td>\s*<td class="noline-bottom line-right center">([^<]*)<\/td>\s*<td class="noline-bottom line-right center">([^<]*)<\/td>\s*<td class="noline-bottom line-right center">([^<]*)<\/td>\s*<td class="noline-bottom center">([^<]*)<\/td>/,
  );
  if (!m) return {};
  return {
    opinion: m[1].trim(),
    targetPrice: m[2].trim(),
    eps: m[3].trim(),
    per: orUndefined(m[4].trim()),
    analystCount: m[5].trim(),
  };
}

function extractRatioRow(html: string, label: string): (string | undefined)[] {
  const re = new RegExp(`<th class="bg txt title ">${escapeRegExp(label)}</th>([\\s\\S]*?)</tr>`);
  const m = html.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(cell => clean(cell[1]) || undefined);
}

function extractRatioYears(html: string): string[] {
  const section = html.match(/<th rowspan="2"[^>]*>주요재무정보<\/th>[\s\S]*?<\/tr>[\s\S]*?<tr>([\s\S]*?)<\/tr>/);
  if (!section) return [];
  return [...section[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => clean(m[1].split(/<br/)[0]));
}

function withPercent(values: (string | undefined)[]): (string | undefined)[] {
  return values.map(v => (v ? `${v}%` : undefined));
}

const VISIBLE_COLUMNS = 6;

function parseFinancialRatios(html: string): {financialYears: string[]; financialRows: FinancialRow[]} {
  const years = extractRatioYears(html).slice(-VISIBLE_COLUMNS);
  if (years.length === 0) {
    return {financialYears: [], financialRows: []};
  }

  const slice = (values: (string | undefined)[]) => values.slice(-VISIBLE_COLUMNS);

  const financialRows: FinancialRow[] = [
    {label: '매출액(억)', values: slice(extractRatioRow(html, '매출액'))},
    {label: '영업이익(억)', values: slice(extractRatioRow(html, '영업이익'))},
    {label: '당기순이익(억)', values: slice(extractRatioRow(html, '당기순이익'))},
    {label: '영업이익률', values: slice(withPercent(extractRatioRow(html, '영업이익률')))},
    {label: '순이익률', values: slice(withPercent(extractRatioRow(html, '순이익률')))},
    {label: 'ROE', values: slice(withPercent(extractRatioRow(html, 'ROE(%)')))},
    {label: 'ROA', values: slice(withPercent(extractRatioRow(html, 'ROA(%)')))},
    {label: '부채비율', values: slice(withPercent(extractRatioRow(html, '부채비율')))},
  ];

  return {financialYears: years, financialRows};
}

export async function fetchStockDetailInfo(code: string): Promise<StockDetailInfo> {
  try {
    const mainUrl = `${MAIN_URL}?cmp_cd=${code}`;
    const mainHtml = await fetchText(mainUrl);
    const encparam = extractEncParam(mainHtml);

    // Referer 헤더가 없으면 빈 응답을 준다. encparam을 못 찾으면 재무비율만 비워두고 나머지는 그대로 보여준다.
    const ratioHtml = encparam
      ? await fetchText(
          `${RATIO_URL}?cmp_cd=${code}&fin_typ=0&freq_typ=Y&extY=0&extQ=0&encparam=${encparam}&id=ZlEwemUxRm`,
          {Referer: mainUrl},
        )
      : '';

    const {financialYears, financialRows} = parseFinancialRatios(ratioHtml);

    return {
      indicator: parseIndicator(mainHtml),
      overview: parseOverview(mainHtml),
      consensus: parseConsensus(mainHtml),
      financialYears,
      financialRows,
    };
  } catch (e) {
    console.warn(`[stock detail] failed: ${code}`, e);
    return EMPTY_DETAIL;
  }
}
