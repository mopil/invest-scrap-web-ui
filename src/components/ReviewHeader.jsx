import { buttonClassName, panelClassName } from "../utils/ui";

function ShortcutHint({ label, keyText }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      <span>{label}</span>
      <kbd className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{keyText}</kbd>
    </span>
  );
}

export default function ReviewHeader({
  dirtyCount,
  loading,
  saving,
  embedding,
  rowsLength,
  activeTabLabel,
  totalCount,
  page,
  totalPages,
  onMarkAllGood,
  onEmbedBadRows,
  onSaveAll,
  onRefresh
}) {
  return (
    <div className={`mb-4 lg:sticky lg:top-4 lg:z-10 ${panelClassName("border-pine-100 bg-white/95 p-4 backdrop-blur")}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">검수 작업</h2>
            <p className="mt-1 text-sm text-slate-500">
              현재 보기: <span className="font-semibold text-slate-800">{activeTabLabel}</span>
              <span className="mx-2 text-slate-300">|</span>
              페이지 <span className="font-semibold text-slate-800">{page}</span> / {totalPages}
              <span className="mx-2 text-slate-300">|</span>총 <span className="font-semibold text-slate-800">{totalCount}</span>건
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                dirtyCount
                  ? "bg-amber-50 text-amber-800 ring-amber-200"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-200"
              }`}
            >
              {dirtyCount ? `미저장 변경 ${dirtyCount}건` : "모든 변경사항 저장됨"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
              현재 페이지 {rowsLength}건 표시 중
            </span>
          </div>
          <div className="hidden flex-wrap gap-2 lg:flex">
            <ShortcutHint label="GOOD" keyText="G" />
            <ShortcutHint label="BAD" keyText="B" />
            <ShortcutHint label="다음 행" keyText="Enter" />
            <ShortcutHint label="저장" keyText="Ctrl/⌘+S" />
          </div>
        </div>

        <div className="hidden gap-2 sm:flex sm:flex-wrap lg:grid">
          <button
            className={buttonClassName("secondary")}
            type="button"
            onClick={onEmbedBadRows}
            disabled={loading || saving || embedding}
          >
            {embedding ? "임베딩 중..." : "임베딩하기"}
          </button>
          <button
            className={buttonClassName("secondary")}
            type="button"
            onClick={onMarkAllGood}
            disabled={loading || saving || embedding || rowsLength === 0}
          >
            현재 페이지 모두 GOOD
          </button>
          <button
            className={buttonClassName("primary")}
            type="button"
            onClick={onSaveAll}
            disabled={saving || embedding || dirtyCount === 0}
          >
            {dirtyCount ? `변경사항 저장 (${dirtyCount})` : "변경사항 저장"}
          </button>
          <button
            className={buttonClassName("secondary")}
            type="button"
            onClick={onRefresh}
            disabled={loading || saving || embedding}
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
