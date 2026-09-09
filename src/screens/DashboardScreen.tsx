import React, {useCallback, useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  LayoutChangeEvent,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as api from '../api/naver';
import * as ecosApi from '../api/ecos';
import {toChangeText, toValueText, toTimeText} from '../api/format';
import {formatEcosTime} from '../api/ecos';
import {colors} from '../theme/colors';

const MIN_CARD_WIDTH = 140;
const CARD_GAP = 12;
const SCREEN_PADDING = 16; // scrollContent의 paddingHorizontal과 반드시 일치해야 함
const DEFAULT_COLUMNS = 2;

interface IndexData {
  label: string;
  value?: string | null;
  change?: string;
  updatedAt?: string;
}

function isUpChange(change?: string): boolean {
  return !!change && change.trim().startsWith('+');
}

function MarketCard({
  label,
  value,
  change,
  updatedAt,
  width,
}: IndexData & {width: number}): React.JSX.Element {
  const up = isUpChange(change);
  return (
    <View style={[styles.marketCard, {width}]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value ?? '불러오는 중'}</Text>
      {change ? (
        <Text style={[styles.cardChange, up ? styles.up : styles.down]}>{change}</Text>
      ) : null}
      {updatedAt ? <Text style={styles.cardTime}>{updatedAt}</Text> : null}
    </View>
  );
}

function CardGrid({
  items,
  cardWidth,
}: {
  items: IndexData[];
  columns: number;
  cardWidth: number;
}): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {items.map(item => (
        <MarketCard key={item.label} {...item} width={cardWidth} />
      ))}
    </View>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function DashboardScreen(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<number>(DEFAULT_COLUMNS);
  const [cardWidth, setCardWidth] = useState<number>(MIN_CARD_WIDTH);

  const [domesticIndex, setDomesticIndex] = useState<IndexData[]>([
    {label: '코스피', value: null},
    {label: '코스닥', value: null},
  ]);
  const [overseasIndex, setOverseasIndex] = useState<IndexData[]>([
    {label: 'S&P500', value: null},
    {label: '나스닥', value: null},
    {label: '니케이225', value: null},
    {label: '필라델피아반도체', value: null},
  ]);
  const [exchangeRates, setExchangeRates] = useState<IndexData[]>([
    {label: '원/달러', value: null},
    {label: '원/100엔', value: null},
    {label: '원/위안', value: null},
  ]);
  const [commodities, setCommodities] = useState<IndexData[]>([
    {label: 'WTI 유가(배럴당)', value: null},
    {label: '국제 금(온스당)', value: null},
  ]);
  const [baseRates, setBaseRates] = useState<IndexData[]>([
    {label: '한국'},
    {label: '미국'},
    {label: '일본'},
  ]);

  const handleScreenLayout = useCallback((e: LayoutChangeEvent) => {
    const screenWidth = e.nativeEvent.layout.width;
    if (screenWidth <= 0) return;

    const usableWidth = screenWidth - SCREEN_PADDING * 2;

    const calculatedColumns = Math.max(
      1,
      Math.floor((usableWidth + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP)),
    );

    const calculatedCardWidth =
      (usableWidth - CARD_GAP * (calculatedColumns - 1)) / calculatedColumns;

    setColumns(calculatedColumns);
    setCardWidth(calculatedCardWidth);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kospi, kosdaq, sp500, nasdaq, nikkei, sox, usd, jpy, cny, wti, gold, krRate, usRate, jpRate] =
        await Promise.all([
          api.fetchKospi(),
          api.fetchKosdaq(),
          api.fetchSP500(),
          api.fetchNasdaq(),
          api.fetchNikkei(),
          api.fetchSox(),
          api.fetchUsdKrw(),
          api.fetchJpyKrw(),
          api.fetchCnyKrw(),
          api.fetchWti(),
          api.fetchGold(),
          ecosApi.fetchKoreaRate(),
          ecosApi.fetchUsRate(),
          ecosApi.fetchJapanRate(),
        ]);

      setDomesticIndex([
        {label: '코스피', value: toValueText(kospi), change: toChangeText(kospi), updatedAt: toTimeText(kospi)},
        {label: '코스닥', value: toValueText(kosdaq), change: toChangeText(kosdaq), updatedAt: toTimeText(kosdaq)},
      ]);
      setOverseasIndex([
        {label: 'S&P500', value: toValueText(sp500), change: toChangeText(sp500), updatedAt: toTimeText(sp500)},
        {label: '나스닥', value: toValueText(nasdaq), change: toChangeText(nasdaq), updatedAt: toTimeText(nasdaq)},
        {label: '니케이225', value: toValueText(nikkei), change: toChangeText(nikkei), updatedAt: toTimeText(nikkei)},
        {label: '필라델피아반도체', value: toValueText(sox), change: toChangeText(sox), updatedAt: toTimeText(sox)},
      ]);
      const jpyPer100 = jpy
        ? (parseFloat(jpy.replace(/,/g, '')) * 100).toLocaleString('ko-KR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : undefined;

      setExchangeRates([
        {label: '원/달러', value: usd ? `${usd}원` : undefined},
        {label: '원/100엔', value: jpyPer100 ? `${jpyPer100}원` : undefined},
        {label: '원/위안', value: cny ? `${cny}원` : undefined},
      ]);
      setCommodities([
        {
          label: 'WTI 유가(배럴당)',
          value: toValueText(wti) ? `${toValueText(wti)} USD` : undefined,
          change: toChangeText(wti),
          updatedAt: toTimeText(wti),
        },
        {
          label: '국제 금(온스당)',
          value: toValueText(gold) ? `${toValueText(gold)} USD` : undefined,
          change: toChangeText(gold),
          updatedAt: toTimeText(gold),
        },
      ]);
      setBaseRates([
        {label: '한국', value: krRate ? `${krRate.DATA_VALUE}%` : undefined, updatedAt: krRate ? formatEcosTime(krRate.TIME) : undefined},
        {label: '미국', value: usRate ? `${usRate.DATA_VALUE}%` : undefined, updatedAt: usRate ? formatEcosTime(usRate.TIME) : undefined},
        {label: '일본', value: jpRate ? `${jpRate.DATA_VALUE}%` : undefined, updatedAt: jpRate ? formatEcosTime(jpRate.TIME) : undefined},
      ]);
    } catch {
      setError('데이터를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    // edges={['top']}: 아래쪽 안전영역은 하단 탭바가 이미 처리해주므로 위쪽만 신경 쓰면 된다
    <SafeAreaView style={styles.safeArea} edges={['top']} onLayout={handleScreenLayout}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>금융 대시보드</Text>
        <TouchableOpacity onPress={loadData} disabled={loading} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>{loading ? '⋯' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }>
        <Section title="국내 지수">
          <CardGrid items={domesticIndex} columns={columns} cardWidth={cardWidth} />
        </Section>
        <Section title="해외 지수">
          <CardGrid items={overseasIndex} columns={columns} cardWidth={cardWidth} />
        </Section>
        <Section title="환율">
          <CardGrid items={exchangeRates} columns={columns} cardWidth={cardWidth} />
        </Section>
        <Section title="원자재">
          <CardGrid items={commodities} columns={columns} cardWidth={cardWidth} />
        </Section>
        <Section title="기준금리">
          <CardGrid items={baseRates} columns={columns} cardWidth={cardWidth} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 12,
  },
  topBarTitle: {fontSize: 18, fontWeight: 'bold', color: colors.textPrimary},
  refreshButton: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  refreshIcon: {fontSize: 20, fontWeight: 'bold', color: colors.accent},
  progressBarTrack: {height: 2, backgroundColor: colors.border, marginHorizontal: SCREEN_PADDING},
  progressBarFill: {height: 2, width: '40%', backgroundColor: colors.accent},
  errorText: {color: colors.rising, fontSize: 13, marginHorizontal: SCREEN_PADDING, marginTop: 6},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: SCREEN_PADDING, paddingBottom: 24},
  section: {marginTop: 20},
  sectionTitle: {fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginVertical: 8},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  marketCard: {backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16},
  cardLabel: {fontSize: 13, color: colors.textSecondary, marginBottom: 4},
  cardValue: {fontSize: 20, fontWeight: 'bold', color: colors.textPrimary},
  cardChange: {fontSize: 13, fontWeight: '600', marginTop: 4},
  cardTime: {fontSize: 11, color: colors.textTertiary, marginTop: 4},
  up: {color: colors.rising},
  down: {color: colors.falling},
});
