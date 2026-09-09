import {NavigatorScreenParams} from '@react-navigation/native';

export type StockDetailParams = {code: string; name: string; market: string};

export type SearchStackParamList = {
  SearchList: undefined;
  StockDetail: StockDetailParams;
};

export type FavoritesStackParamList = {
  FavoritesList: undefined;
  StockDetail: StockDetailParams;
};

export type RootTabParamList = {
  Dashboard: undefined;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  FavoritesTab: NavigatorScreenParams<FavoritesStackParamList>;
};
