import {NaverRealtimeItem} from './naver';

export function toChangeText(item: NaverRealtimeItem | null): string | undefined {
  if (!item) return undefined;
  const num = parseFloat(item.fluctuationsRatio);
  if (Number.isNaN(num)) return undefined;
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  return `${sign}${Math.abs(num).toFixed(2)}%`;
}

export function toValueText(item: NaverRealtimeItem | null): string | undefined {
  return item?.closePrice;
}

export function toTimeText(item: NaverRealtimeItem | null): string | undefined {
  if (!item?.localTradedAt) return undefined;
  const d = new Date(item.localTradedAt);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(
    d.getHours(),
  )}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}