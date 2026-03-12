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
  reviewedBadCount,
  reviewedFilter,
  setReviewedFilter,
  searchType,
  setSearchType,
  searchKeyword,
  setSearchKeyword
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit gap-2 rounded-full bg-pine-100 p-1">
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "pending" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"}`} onClick={() => setTab("pending")}>리뷰할 것 ({pendingCount})</button>
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "reviewed_bad" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"}`} onClick={() => setTab("reviewed_bad")}>BAD로 평가함 ({reviewedBadCount})</button>
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "reviewed" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"}`} onClick={() => setTab("reviewed")}>전체 ({reviewedCount})</button>
        </div>
        {tab === "reviewed_bad" ? (
          <div className="inline-flex w-fit gap-2 rounded-full bg-rose-100 p-1">
            {REVIEWED_FILTER_OPTIONS.map((option) => (
              <button key={option.value} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${reviewedFilter === option.value ? "bg-white text-rose-700 shadow" : "text-rose-700/80"}`} onClick={() => setReviewedFilter(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          <span>검색</span>
          <div className="flex gap-2">
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100" value={searchType} onChange={(event) => setSearchType(event.target.value)}>
              <option value="title">제목</option>
              <option value="author">author</option>
            </select>
            <input className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100" type="text" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="키워드 입력" />
          </div>
        </label>
        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          <span>시작일</span>
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
          <span>종료일</span>
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
      </div>
    </div>
  );
}
