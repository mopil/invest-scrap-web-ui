export const PENDING_SUBJECTS = [
  '일반',
  '매매일지',
  '헛소리',
  '계집',
  '광견병',
];
export const PAGE_SIZE = 20;
export const DEFAULT_DATE_RANGE_DAYS = 7;
export const SELECTED_ROW_STORAGE_KEY = 'invest-scrap-selected-row';
export const BAD_REASON_OPTIONS = [
  '투자 정보처럼 보이지만 실질 내용이 없는 글/제목',
  '투자와 관련 없는 일상적인 짧은 잡담',
  '음식/바이럴 관련 잡담',
  '너무 기초적인 이야기 또는 질문',
];
export const BAD_REASON_CUSTOM = '__custom__';
export const REVIEWED_FILTER_OPTIONS = [
  { value: 'bad_no_reason', label: '사유 미입력' },
  { value: 'bad_with_reason', label: '사유 입력 완료' },
  { value: 'bad', label: '전체' },
];
