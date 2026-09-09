import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../navigation/types';
import {StockSummary} from '../types/stock';
import {fetchStockSearch} from '../api/stockSearch';
import {getFavorites, addFavorite, removeFavorite} from '../db/favorites';
import {colors} from '../theme/colors';

type SearchScreenNavigationProp = NativeStackNavigationProp<SearchStackParamList, 'SearchList'>;

function StarButton({active, onPress}: {active: boolean; onPress: () => void}): React.JSX.Element {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} style={styles.starButton}>
      <Text style={[styles.starIcon, active && styles.starIconActive]}>{active ? '★' : '☆'}</Text>
    </TouchableOpacity>
  );
}

export default function SearchScreen(): React.JSX.Element {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favoriteCodes, setFavoriteCodes] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(items => setFavoriteCodes(new Set(items.map(item => item.code))));
    }, []),
  );

  const handleSearch = async () => {
    const keyword = query.trim();
    setSearched(true);
    if (!keyword) {
      setResults([]);
      return;
    }
    setLoading(true);
    const items = await fetchStockSearch(keyword);
    setResults(items);
    setLoading(false);
  };

  const toggleFavorite = async (item: StockSummary) => {
    const isCurrentlyFavorite = favoriteCodes.has(item.code);
    if (isCurrentlyFavorite) {
      await removeFavorite(item.code);
    } else {
      await addFavorite(item.code, item.name, item.market);
    }
    setFavoriteCodes(prev => {
      const next = new Set(prev);
      if (isCurrentlyFavorite) {
        next.delete(item.code);
      } else {
        next.add(item.code);
      }
      return next;
    });
  };

  const renderItem = ({item}: {item: StockSummary}) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('StockDetail', item)}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowSub}>
          {item.code} · {item.market}
        </Text>
      </View>
      <StarButton active={favoriteCodes.has(item.code)} onPress={() => toggleFavorite(item)} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="종목명 또는 종목코드 입력"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searched ? '검색 결과가 없습니다' : '종목명이나 코드를 검색해보세요'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {color: colors.background, fontWeight: 'bold', fontSize: 14},
  loading: {marginTop: 40},
  listContent: {paddingHorizontal: 16, paddingBottom: 24},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rowInfo: {flex: 1},
  rowName: {fontSize: 15, fontWeight: 'bold', color: colors.textPrimary},
  rowSub: {fontSize: 12, color: colors.textSecondary, marginTop: 2},
  starButton: {padding: 4},
  starIcon: {fontSize: 20, color: colors.textTertiary},
  starIconActive: {color: colors.accent},
  emptyText: {textAlign: 'center', color: colors.textTertiary, marginTop: 40, fontSize: 13},
});
