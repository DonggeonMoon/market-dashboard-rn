import {NaverRealtimeItem} from './naver';

export function toChangeText(item: NaverRealtimeItem | null): string | undefined {
  if (!item) return undefined;
  const ratio = item.fluctuationsRatio;
  const isDown =
    item.fluctuationsType?.name === 'FALLING' ||
    item.compareToPreviousPrice?.name === 'FALLING';
  const sign = isDown ? '-' : '+';
  const cleanRatio = ratio.replace('-', ''); // 부호 중복 방지
  return `${sign}${cleanRatio}%`;
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