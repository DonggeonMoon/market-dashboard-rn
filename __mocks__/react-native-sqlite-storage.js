// react-native-sqlite-storage는 네이티브 모듈이라 Jest(Node 환경, 네이티브 브리지 없음)에서는 동작하지 않는다.
// 테스트에서는 화면이 렌더링되는지만 확인하면 되므로, 아무 데이터도 없는 빈 DB처럼 동작하는 가짜 구현으로 대체한다.
const emptyResult = {rows: {length: 0, item: () => undefined}, rowsAffected: 0, insertId: 0};

const mockDb = {
  executeSql: jest.fn().mockResolvedValue([emptyResult]),
};

module.exports = {
  enablePromise: jest.fn(),
  openDatabase: jest.fn().mockResolvedValue(mockDb),
};
