import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootTabParamList, SearchStackParamList, FavoritesStackParamList} from './types';
import {colors} from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import StockDetailScreen from '../screens/StockDetailScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();

function SearchStackNavigator(): React.JSX.Element {
  return (
    <SearchStack.Navigator screenOptions={{headerTintColor: colors.accent}}>
      <SearchStack.Screen name="SearchList" component={SearchScreen} options={{title: '검색'}} />
      <SearchStack.Screen
        name="StockDetail"
        component={StockDetailScreen}
        options={({route}) => ({title: route.params.name})}
      />
    </SearchStack.Navigator>
  );
}

function FavoritesStackNavigator(): React.JSX.Element {
  return (
    <FavoritesStack.Navigator screenOptions={{headerTintColor: colors.accent}}>
      <FavoritesStack.Screen
        name="FavoritesList"
        component={FavoritesScreen}
        options={{title: '관심종목'}}
      />
      <FavoritesStack.Screen
        name="StockDetail"
        component={StockDetailScreen}
        options={({route}) => ({title: route.params.name})}
      />
    </FavoritesStack.Navigator>
  );
}

// tabBarIcon 컴포넌트는 RootNavigator 밖(모듈 최상위)에서 정의해야 리렌더링마다 새로 마운트되지 않는다.
function TabIcon({label, focused}: {label: string; focused: boolean}): React.JSX.Element {
  return <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{label}</Text>;
}

function DashboardTabIcon({focused}: {focused: boolean}): React.JSX.Element {
  return <TabIcon label="📊" focused={focused} />;
}
function SearchTabIcon({focused}: {focused: boolean}): React.JSX.Element {
  return <TabIcon label="🔍" focused={focused} />;
}
function FavoritesTabIcon({focused}: {focused: boolean}): React.JSX.Element {
  return <TabIcon label="⭐" focused={focused} />;
}

export default function RootNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: '대시보드',
          tabBarIcon: DashboardTabIcon,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{
          title: '검색',
          tabBarIcon: SearchTabIcon,
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStackNavigator}
        options={{
          title: '관심종목',
          tabBarIcon: FavoritesTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {fontSize: 20, opacity: 0.5},
  tabIconFocused: {opacity: 1},
});
