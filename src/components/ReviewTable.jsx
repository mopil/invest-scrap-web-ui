import { BAD_REASON_CUSTOM, BAD_REASON_OPTIONS } from "../constants/review";
import { buildDocumentUrl, formatDateTime } from "../utils/format";
import { getScoreTone } from "../utils/ui";

function getBadReasonSelectValue(reason, badReasonMode) {
  if (badReasonMode) {
    return badReasonMode;
  }

  if (!reason) {
    return "";
  }

  if (BAD_REASON_OPTIONS.includes(reason)) {
    return reason;
  }

  return BAD_REASON_CUSTOM;
}

function MetaChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-pine-50 px-2.5 py-1 text-xs text-slate-500 ring-1 ring-inset ring-pine-100">
      <strong className="font-bold text-pine-900">{label}</strong>
      <span>{value ?? "-"}</span>
    </span>
  );
}

function ReasonField({ row, currentType, currentReason, badReasonMode, onBadReasonModeChange, onReasonChange }) {
  const badReasonValue = getBadReasonSelectValue(currentReason, badReasonMode);
  const showCustomBadReason = currentType === "BAD" && badReasonValue === BAD_REASON_CUSTOM;

  if (currentType === "BAD") {
    return (
      <div className="grid gap-2">
        <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100" value={badReasonValue} onClick={(event) => event.stopPropagation()} onChange={(event) => {
          const nextValue = event.target.value;
          onBadReasonModeChange(row, nextValue);
          if (BAD_REASON_OPTIONS.includes(nextValue)) {
            onReasonChange(row, nextValue);
            return;
          }
          if (nextValue === BAD_REASON_CUSTOM) {
            onReasonChange(row, BAD_REASON_OPTIONS.includes(currentReason) ? "" : currentReason ?? "");
            return;
          }
          onReasonChange(row, "");
        }}>
          <option value="">사유 선택</option>
          {BAD_REASON_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value={BAD_REASON_CUSTOM}>else 직접입력</option>
        </select>
        {showCustomBadReason ? (
          <textarea className="min-h-[104px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-pine-500 focus:bg-white focus:ring-2 focus:ring-pine-100" value={currentReason ?? ""} placeholder="직접 사유를 입력하세요" onClick={(event) => event.stopPropagation()} onChange={(event) => onReasonChange(row, event.target.value)} />
        ) : null}
      </div>
    );
  }

  return <textarea className="min-h-[104px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-pine-500 focus:bg-white focus:ring-2 focus:ring-pine-100" value={currentReason ?? ""} placeholder="사유를 입력하세요" onClick={(event) => event.stopPropagation()} onChange={(event) => onReasonChange(row, event.target.value)} />;
}

function DocumentRow({ row, draft, badReasonMode, isSelected, onSelect, onTypeChange, onBadReasonModeChange, onReasonChange }) {
  const currentType = draft?.good_bad_type ?? row.good_bad_type ?? null;
  const currentReason = draft?.eval_reason ?? row.eval_reason ?? "";
  const scoreTone = getScoreTone(row.infer_score);

  let toneClass = "bg-white/80";
  if (currentType === "GOOD") {
    toneClass = "bg-emerald-50";
  } else if (currentType === "BAD") {
    toneClass = "bg-rose-50";
  } else if (draft) {
    toneClass = "bg-amber-50";
  }

  const rowClasses = isSelected ? `${toneClass} ring-2 ring-inset ring-yellow-300` : toneClass;

  return (
    <tr className={`${rowClasses} border-b border-slate-200 last:border-b-0 transition`} data-row-id={row.id} onClick={() => onSelect(row.id)}>
      <td className="relative min-w-[420px] px-4 py-4 align-top">
        {isSelected ? <div className="absolute inset-y-3 left-1 w-1 rounded-full bg-yellow-400" /> : null}
        <div className={isSelected ? "pl-3" : ""}>
          <a className="inline-block text-base font-bold leading-6 text-pine-900 transition hover:text-pine-700 hover:underline" href={buildDocumentUrl(row.board_id, row.document_id)} target="_blank" rel="noreferrer" onClick={() => onSelect(row.id)}>
            {row.title || row.subject || "제목 없음"}
          </a>
          {row.subject ? <div className="mt-2 text-sm leading-6 text-slate-500">{row.subject}</div> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <MetaChip label="ID" value={row.id} />
            <MetaChip label="DOC" value={row.document_id} />
            <MetaChip label="BOARD" value={row.board_id} />
            <MetaChip label="AUTHOR" value={row.author} />
            <MetaChip label="COMMENTS" value={row.comment_count} />
            <MetaChip label="VIEWS" value={row.view_count} />
          </div>
        </div>
      </td>
      <td className="w-[190px] px-4 py-4 align-top">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${currentType === "GOOD" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"}`} onClick={(event) => { event.stopPropagation(); onTypeChange(row, "GOOD"); }}>GOOD</button>
          <button type="button" className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${currentType === "BAD" ? "border-rose-700 bg-rose-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50"}`} onClick={(event) => { event.stopPropagation(); onTypeChange(row, "BAD"); }}>BAD</button>
        </div>
      </td>
      <td className="w-[360px] px-4 py-4 align-top">
        <ReasonField row={row} currentType={currentType} currentReason={currentReason} badReasonMode={badReasonMode} onBadReasonModeChange={onBadReasonModeChange} onReasonChange={onReasonChange} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-top">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${scoreTone}`}>{row.infer_score ?? "-"}</span>
      </td>
      <td className="min-w-[210px] px-4 py-4 align-top text-sm text-slate-500">
        <div className="leading-6"><span className="mr-2 font-semibold text-pine-900">Created</span>{formatDateTime(row.created_at)}</div>
        <div className="leading-6"><span className="mr-2 font-semibold text-pine-900">Scrapped</span>{formatDateTime(row.scrapped_at)}</div>
      </td>
    </tr>
  );
}

export default function ReviewTable({ loading, displayRows, drafts, badReasonModes, selectedRowId, rowKey, onSelect, onTypeChange, onBadReasonModeChange, onReasonChange }) {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50/80">
      <table className="w-full min-w-[980px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
            <th className="bg-pine-50 px-4 py-3 font-semibold">INFO</th>
            <th className="bg-pine-50 px-4 py-3 font-semibold">GOOD / BAD</th>
            <th className="bg-pine-50 px-4 py-3 font-semibold">REASON</th>
            <th className="bg-pine-50 px-4 py-3 font-semibold">Infer Score</th>
            <th className="bg-pine-50 px-4 py-3 font-semibold">Timeline</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">데이터를 불러오는 중입니다...</td></tr>
          ) : displayRows.length ? (
            displayRows.map((row) => (
              <DocumentRow key={row.id} row={row} draft={drafts[rowKey(row.id)]} badReasonMode={badReasonModes[rowKey(row.id)]} isSelected={selectedRowId === String(row.id)} onSelect={onSelect} onTypeChange={onTypeChange} onBadReasonModeChange={onBadReasonModeChange} onReasonChange={onReasonChange} />
            ))
          ) : (
            <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">조건에 맞는 데이터가 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
