import { buttonClassName } from "../utils/ui";

export default function ReviewHeader({
  dirtyCount,
  loading,
  saving,
  rowsLength,
  onMarkAllGood,
  onSaveAll,
  onRefresh
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900">평가 작업</h2>
      </div>

      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <button
          className={buttonClassName("secondary")}
          type="button"
          onClick={onMarkAllGood}
          disabled={loading || saving || rowsLength === 0}
        >
          전부 GOOD
        </button>
        <button
          className={buttonClassName("primary")}
          type="button"
          onClick={onSaveAll}
          disabled={saving || dirtyCount === 0}
        >
          {dirtyCount ? `Save all (${dirtyCount})` : "Save all"}
        </button>
        <button
          className={buttonClassName("secondary")}
          type="button"
          onClick={onRefresh}
          disabled={loading || saving}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
