import { buttonClassName } from "../utils/ui";

export default function ReviewHeader({ dirtyCount, loading, saving, rowsLength, onMarkAllGood, onSaveAll, onRefresh }) {
  return (
    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Documents</h2>
        <p className="text-sm text-slate-500">리뷰할 것은 subject가 일반, 매매일지, 광견병, 헛소리, 계집인 문서만 표시됩니다.</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-pine-50 px-3 py-1 font-medium text-pine-900 ring-1 ring-inset ring-pine-100">링크를 열어 확인한 뒤 GOOD/BAD와 사유를 입력하세요.</span>
          <span className={`rounded-full px-3 py-1 font-medium ring-1 ring-inset ${dirtyCount ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}>
            {dirtyCount ? `저장되지 않은 변경 ${dirtyCount}건` : "저장되지 않은 변경 없음"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={buttonClassName("secondary")} type="button" onClick={onMarkAllGood} disabled={loading || saving || rowsLength === 0}>전부 GOOD</button>
        <button className={buttonClassName("primary")} type="button" onClick={onSaveAll} disabled={saving || dirtyCount === 0}>{dirtyCount ? `Save all (${dirtyCount})` : "Save all"}</button>
        <button className={buttonClassName("secondary")} type="button" onClick={onRefresh} disabled={loading || saving}>Refresh</button>
      </div>
    </div>
  );
}
