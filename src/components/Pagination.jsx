import { buttonClassName } from "../utils/ui";

export default function Pagination({ page, totalPages, totalCount, onPrev, onNext }) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        총 <span className="font-semibold text-slate-900">{totalCount}</span>건
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-semibold text-slate-900">{page}</span> / {totalPages || 1} 페이지
      </div>
      <div className="flex gap-2">
        <button className={buttonClassName("secondary")} type="button" onClick={onPrev} disabled={page <= 1}>
          이전
        </button>
        <button
          className={buttonClassName("secondary")}
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
}
