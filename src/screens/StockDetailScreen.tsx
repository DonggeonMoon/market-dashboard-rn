import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useRoute} from '@react-navigation/native';
import {StockDetailParams} from '../navigation/types';
import {StockPrice, StockDetailInfo} from '../types/stock';
import {fetchStockPrice} from '../api/stockPrice';
import {fetchStockDetailInfo} from '../api/stockDetail';
import {isFavorite as checkIsFavorite, addFavorite, removeFavorite} from '../db/favorites';
import {colors} from '../theme/colors';

type DetailRouteProp = RouteProp<{StockDetail: StockDetailParams}, 'StockDetail'>;

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({label, value}: {label: string; value?: string}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

function FinancialTable({
  years,
  rows,
}: {
  years: string[];
  rows: {label: string; values: (string | undefined)[]}[];
}): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableLabelCell]}>구분</Text>
          {years.map(year => (
            <Text key={year} style={[styles.tableCell, styles.tableHeaderCell]}>
              {year}
            </Text>
          ))}
        </View>
        {rows.map(row => (
          <View key={row.label} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableLabelCell]}>{row.label}</Text>
            {row.values.map((v, i) => (
              <Text key={i} style={styles.tableCell}>
                {v || '-'}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function formatUpdatedAt(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(
    d.getMinutes(),
  )}:${two(d.getSeconds())}`;
}

export default function StockDetailScreen(): React.JSX.Element {
  const {params} = useRoute<DetailRouteProp>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState<StockPrice | null>(null);
  const [detail, setDetail] = useState<StockDetailInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchStockPrice(params.code),
      fetchStockDetailInfo(params.code),
      checkIsFavorite(params.code),
    ]).then(([priceResult, detailResult, favoriteResult]) => {
      if (cancelled) return;
      setPrice(priceResult);
      setDetail(detailResult);
      setIsFavorite(favoriteResult);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.code]);

  const toggleFavorite = async () => {
    if (isFavorite) {
      await removeFavorite(params.code);
      setIsFavorite(false);
    } else {
      await addFavorite(params.code, params.name, price?.market || params.market);
      setIsFavorite(true);
    }
  };

  const isUp = price?.direction === 'RISING';
  const isDown = price?.direction === 'FALLING';
  const sign = isDown ? '-' : isUp ? '+' : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.stockName}>{params.name}</Text>
            <Text style={styles.stockSub}>
              {params.code} · {price?.market || params.market}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleFavorite} hitSlop={8}>
            <Text style={[styles.starIcon, isFavorite && styles.starIconActive]}>
              {isFavorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loading} color={colors.accent} />
        ) : (
          <>
            <Section title="기본정보">
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>{price?.closePrice ?? '-'}원</Text>
                {price ? (
                  <Text style={[styles.priceChange, isDown ? styles.down : styles.up]}>
                    {sign}
                    {price.changePrice} ({sign}
                    {price.changeRatio}%)
                  </Text>
                ) : null}
              </View>
              <InfoRow label="시가" value={price ? `${price.openPrice}원` : undefined} />
              <InfoRow label="고가" value={price ? `${price.highPrice}원` : undefined} />
              <InfoRow label="저가" value={price ? `${price.lowPrice}원` : undefined} />
              <InfoRow label="거래량" value={price ? `${price.volume}주` : undefined} />
              <InfoRow label="거래대금" value={price ? `${price.tradeValue}원` : undefined} />
              {price?.updatedAt ? (
                <Text style={styles.updatedAt}>기준시각 {formatUpdatedAt(price.updatedAt)}</Text>
              ) : null}
            </Section>

            <Section title="투자지표">
              <InfoRow label="PER" value={detail?.indicator.per} />
              <InfoRow label="EPS" value={detail?.indicator.eps} />
              <InfoRow label="추정PER" value={detail?.indicator.estimatedPer} />
              <InfoRow label="추정EPS" value={detail?.indicator.estimatedEps} />
              <InfoRow label="PBR" value={detail?.indicator.pbr} />
              <InfoRow label="BPS" value={detail?.indicator.bps} />
              <InfoRow label="배당수익률" value={detail?.indicator.dividendYield} />
              <InfoRow label="시가총액" value={detail?.indicator.marketCap ?? price?.marketCap} />
              <InfoRow label="52주 최고" value={detail?.indicator.week52High} />
              <InfoRow label="52주 최저" value={detail?.indicator.week52Low} />
              <InfoRow label="외국인지분율" value={detail?.indicator.foreignRatio} />
            </Section>

            <Section title="기업개요">
              {detail && detail.overview.length > 0 ? (
                detail.overview.map((line, i) => (
                  <Text key={i} style={styles.overviewLine}>
                    · {line}
                  </Text>
                ))
              ) : (
                <Text style={styles.overviewLine}>제공되는 개요 정보가 없습니다</Text>
              )}
            </Section>

            <Section title="재무비율">
              {detail && detail.financialRows.length > 0 ? (
                <FinancialTable years={detail.financialYears} rows={detail.financialRows} />
              ) : (
                <Text style={styles.overviewLine}>재무 데이터를 불러오지 못했습니다</Text>
              )}
            </Section>

            <Section title="컨센서스">
              <InfoRow label="투자의견" value={detail?.consensus.opinion} />
              <InfoRow label="목표주가" value={detail?.consensus.targetPrice ? `${detail.consensus.targetPrice}원` : undefined} />
              <InfoRow label="EPS" value={detail?.consensus.eps} />
              <InfoRow label="PER" value={detail?.consensus.per} />
              <InfoRow label="추정기관수" value={detail?.consensus.analystCount} />
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  scrollContent: {padding: 16, paddingBottom: 32},
  loading: {marginTop: 60},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockName: {fontSize: 20, fontWeight: 'bold', color: colors.textPrimary},
  stockSub: {fontSize: 13, color: colors.textSecondary, marginTop: 2},
  starIcon: {fontSize: 28, color: colors.textTertiary},
  starIconActive: {color: colors.accent},
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 10},
  priceRow: {flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10},
  priceValue: {fontSize: 22, fontWeight: 'bold', color: colors.textPrimary},
  priceChange: {fontSize: 14, fontWeight: '600'},
  up: {color: colors.rising},
  down: {color: colors.falling},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {fontSize: 13, color: colors.textSecondary},
  infoValue: {fontSize: 13, color: colors.textPrimary, fontWeight: '600'},
  updatedAt: {fontSize: 11, color: colors.textTertiary, marginTop: 6},
  overviewLine: {fontSize: 13, color: colors.textPrimary, lineHeight: 20},
  tableRow: {flexDirection: 'row'},
  tableCell: {
    width: 92,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tableLabelCell: {width: 110, textAlign: 'left', color: colors.textSecondary},
  tableHeaderCell: {fontWeight: 'bold', color: colors.textPrimary},
});
