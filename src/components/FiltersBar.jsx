import { REVIEWED_FILTER_OPTIONS } from "../constants/review";

export default function FiltersBar({
  tab,
  setTab,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  pendingCount,
  reviewedCount,
  reviewedGoodCount,
  reviewedBadCount,
  reviewedFilter,
  setReviewedFilter,
  searchType,
  setSearchType,
  searchKeyword,
  setSearchKeyword
}) {
  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 rounded-[24px] bg-pine-100 p-2 sm:inline-flex sm:w-fit sm:flex-wrap sm:gap-2 sm:rounded-full sm:p-1">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "pending" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
            }`}
            onClick={() => setTab("pending")}
            aria-pressed={tab === "pending"}
          >
            미검수 ({pendingCount})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "reviewed_good" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
            }`}
            onClick={() => setTab("reviewed_good")}
            aria-pressed={tab === "reviewed_good"}
          >
            GOOD 완료 ({reviewedGoodCount})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "reviewed_bad" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
            }`}
            onClick={() => setTab("reviewed_bad")}
            aria-pressed={tab === "reviewed_bad"}
          >
            BAD 완료 ({reviewedBadCount})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "reviewed" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
            }`}
            onClick={() => setTab("reviewed")}
            aria-pressed={tab === "reviewed"}
          >
            전체 검수 완료 ({reviewedCount})
          </button>
        </div>

        {tab === "reviewed_bad" ? (
          <div className="grid grid-cols-1 gap-2 rounded-[24px] bg-rose-100 p-2 sm:inline-flex sm:w-fit sm:flex-wrap sm:gap-2 sm:rounded-full sm:p-1">
            {REVIEWED_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  reviewedFilter === option.value ? "bg-white text-rose-700 shadow" : "text-rose-700/80"
                }`}
                onClick={() => setReviewedFilter(option.value)}
                aria-pressed={reviewedFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.4fr)_minmax(0,0.4fr)]">
        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          <span>검색</span>
          <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100"
              value={searchType}
              onChange={(event) => setSearchType(event.target.value)}
            >
              <option value="title">제목</option>
              <option value="author">작성자</option>
            </select>
            <input
              className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="검색어를 입력하세요"
            />
          </div>
          <span className="text-[11px] normal-case tracking-normal text-slate-400">
            검색어가 있어도 현재 탭과 날짜 범위를 그대로 유지합니다.
          </span>
        </label>

        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          <span>시작일</span>
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          <span>종료일</span>
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
