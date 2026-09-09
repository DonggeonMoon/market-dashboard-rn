/**
 * @format
 */
import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import {initDatabase} from './src/db/favorites';

function App(): React.JSX.Element {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    // SafeAreaProvider: 기기별 노치/홈 인디케이터 크기를 하위 화면들이 알 수 있게 해주는 공급자.
    //   앱 전체에서 한 번만 최상단에 둔다.
    // NavigationContainer: React Navigation이 화면 이동 상태(스택, 현재 화면 등)를 관리하는 최상위 컴포넌트.
    //   이 아래에 RootNavigator(하단 탭 3개)를 연결한다.
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
