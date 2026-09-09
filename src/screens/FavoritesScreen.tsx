import React, {useCallback, useState} from 'react';
import {View, Text, TouchableOpacity, FlatList, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FavoritesStackParamList} from '../navigation/types';
import {StockSummary} from '../types/stock';
import {getFavorites, removeFavorite as removeFavoriteFromDb} from '../db/favorites';
import {colors} from '../theme/colors';

type FavoritesScreenNavigationProp = NativeStackNavigationProp<FavoritesStackParamList, 'FavoritesList'>;

export default function FavoritesScreen(): React.JSX.Element {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const [favorites, setFavorites] = useState<StockSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavorites);
    }, []),
  );

  const removeFavorite = async (code: string) => {
    await removeFavoriteFromDb(code);
    setFavorites(prev => prev.filter(item => item.code !== code));
  };

  const renderItem = ({item}: {item: StockSummary}) => (
    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('StockDetail', item)}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowSub}>
          {item.code} · {item.market}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFavorite(item.code)} hitSlop={8} style={styles.starButton}>
        <Text style={styles.starIcon}>★</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={favorites}
        keyExtractor={item => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>관심종목이 없습니다</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  listContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24},
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
  starIcon: {fontSize: 20, color: colors.accent},
  emptyText: {textAlign: 'center', color: colors.textTertiary, marginTop: 40, fontSize: 13},
});
