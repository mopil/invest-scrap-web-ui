export const PENDING_SUBJECTS = ["일반", "매매일지", "광견병", "헛소리", "계집"];
export const PAGE_SIZE = 20;
export const SELECTED_ROW_STORAGE_KEY = "invest-scrap-selected-row";
export const BAD_REASON_OPTIONS = [
  "투자 정보 처럼 보이지만 실상 상관없는 글/제목",
  "일상 적인 뻘글",
  "너무 기초적인 이야기, 질문"
];
export const BAD_REASON_CUSTOM = "__custom__";
export const REVIEWED_FILTER_OPTIONS = [
  { value: "bad_no_reason", label: "BAD 사유 미입력" },
  { value: "bad_with_reason", label: "BAD + 사유" },
  { value: "bad", label: "BAD 전체" }
];
