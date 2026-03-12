import { useEffect, useMemo, useState } from "react";
import { buildDocumentUrl, formatDateTime } from "../utils/format";
import { buttonClassName, getScoreTone, panelClassName } from "../utils/ui";
import StatusBanner from "./StatusBanner";

function StatCard({ label, value, hint }) {
  return (
    <section className={panelClassName("p-5")}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </section>
  );
}

function ProgressBar({ label, count, ratio, active, onClick }) {
  return (
    <button
      type="button"
      className={`grid w-full gap-2 rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-pine-300 bg-pine-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-pine-200 hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-slate-500">
          {count}건 / {ratio.toFixed(1)}%
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-pine-600" style={{ width: `${Math.min(ratio, 100)}%` }} />
      </div>
    </button>
  );
}

function TrendBars({ items, maxCount }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">선택한 기간에 BAD 데이터가 없습니다.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const heightRatio = maxCount ? Math.max((item.count / maxCount) * 100, 8) : 0;
        return (
          <div key={item.date} className="grid grid-cols-[92px_minmax(0,1fr)_48px] items-center gap-3">
            <span className="text-sm text-slate-500">{item.date}</span>
            <div className="flex h-10 items-end rounded-2xl bg-slate-100 px-2 py-1">
              <div className="w-full rounded-xl bg-amber-400" style={{ height: `${heightRatio}%` }} />
            </div>
            <span className="text-right text-sm font-semibold text-slate-700">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function RowMappingTable({ rows, selectedGroupLabel }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">선택한 사유에 매핑된 row가 없습니다.</p>;
  }

  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50/70">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
            <th className="bg-white px-4 py-3 font-semibold">사유 버킷</th>
            <th className="bg-white px-4 py-3 font-semibold">문서</th>
            <th className="bg-white px-4 py-3 font-semibold">원문 사유</th>
            <th className="bg-white px-4 py-3 font-semibold">점수</th>
            <th className="bg-white px-4 py-3 font-semibold">작성자</th>
            <th className="bg-white px-4 py-3 font-semibold">최근 시각</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const scoreTone = getScoreTone(row.inferScore);
            return (
              <tr key={row.id} className="border-b border-slate-200 last:border-b-0">
                <td className="px-4 py-4 align-top">
                  <span className="inline-flex rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold text-pine-900">
                    {selectedGroupLabel}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <a
                    className="font-semibold text-pine-900 hover:underline"
                    href={buildDocumentUrl(row.boardId, row.documentId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.title}
                  </a>
                  {row.subject ? <div className="mt-1 text-sm text-slate-500">{row.subject}</div> : null}
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-700">{row.rawReason || "-"}</td>
                <td className="px-4 py-4 align-top">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${scoreTone}`}>
                    {row.inferScore ?? "-"}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-700">{row.author || "-"}</td>
                <td className="px-4 py-4 align-top text-sm text-slate-500">
                  {formatDateTime(row.updatedAt || row.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    return;
  }

  const headers = [
    "mapped_reason",
    "raw_reason",
    "document_id",
    "board_id",
    "title",
    "subject",
    "author",
    "infer_score",
    "created_at",
    "updated_at",
    "document_url"
  ];

  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.mappedReason,
        row.rawReason,
        row.documentId,
        row.boardId,
        row.title,
        row.subject,
        row.author,
        row.inferScore ?? "",
        row.createdAt ?? "",
        row.updatedAt ?? "",
        buildDocumentUrl(row.boardId, row.documentId)
      ]
        .map(escapeCsvValue)
        .join(",")
    )
  ];

  const blob = new Blob(["\uFEFF", csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildCsvFilename(prefix, dateFrom, dateTo, suffix = "") {
  const safeSuffix = suffix ? `-${suffix.replace(/[^\w\-]+/g, "_")}` : "";
  return `${prefix}-${dateFrom}-${dateTo}${safeSuffix}.csv`;
}

export default function BadReasonDashboard({
  loading,
  status,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  stats,
  onRefresh
}) {
  const [selectedReasonKey, setSelectedReasonKey] = useState("");

  const dailyMax = Math.max(...(stats?.dailyStats || []).map((item) => item.count), 0);
  const reasonOptions = stats?.mappedReasonGroups || [];

  useEffect(() => {
    if (!reasonOptions.length) {
      setSelectedReasonKey("");
      return;
    }

    const matched = reasonOptions.find((group) => group.key === selectedReasonKey);
    if (!matched) {
      setSelectedReasonKey(reasonOptions[0].key);
    }
  }, [reasonOptions, selectedReasonKey]);

  const selectedReasonGroup = useMemo(
    () => reasonOptions.find((group) => group.key === selectedReasonKey) || null,
    [reasonOptions, selectedReasonKey]
  );

  const flattenedRows = useMemo(() => reasonOptions.flatMap((group) => group.rows), [reasonOptions]);

  function handleExportSelected() {
    if (!selectedReasonGroup?.rows?.length) {
      return;
    }

    downloadCsv(
      buildCsvFilename("bad-reason-mapping", dateFrom, dateTo, selectedReasonGroup.label),
      selectedReasonGroup.rows
    );
  }

  function handleExportAll() {
    if (!flattenedRows.length) {
      return;
    }

    downloadCsv(buildCsvFilename("bad-reason-mapping-all", dateFrom, dateTo), flattenedRows);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-amber-100 bg-amber-50/70 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700">BAD Reason Dashboard</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">BAD 사유-문서 매핑 대시보드</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            프롬프트 고도화를 위해 어떤 row가 어떤 BAD 사유 버킷으로 매핑됐는지 직접 확인하고 CSV로 내보낼 수 있습니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            <span>시작일</span>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            <span>종료일</span>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <button className={buttonClassName("secondary")} type="button" onClick={onRefresh} disabled={loading}>
            새로고침
          </button>
        </div>
      </div>

      <StatusBanner status={status} />

      <div className="flex justify-end">
        <button
          className={buttonClassName("secondary")}
          type="button"
          onClick={handleExportAll}
          disabled={!flattenedRows.length}
        >
          전체 매핑 CSV
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatCard
          label="전체 BAD"
          value={stats ? stats.totalBadCount.toLocaleString() : "-"}
          hint="선택한 기간 내 BAD 판정 전체 건수입니다."
        />
        <StatCard
          label="사유 매핑 완료"
          value={stats ? stats.mappedRowsCount.toLocaleString() : "-"}
          hint="사유가 입력되어 버킷에 매핑 가능한 row 수입니다."
        />
        <StatCard
          label="직접입력 사유"
          value={stats ? stats.customReasonCount.toLocaleString() : "-"}
          hint={stats ? `사유 미입력 ${stats.noReasonCount}건은 보조 지표로만 유지합니다.` : "표준 사유 외 직접입력 건수"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <section className={panelClassName("p-5")}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">사유별 분포</h3>
            <p className="text-sm text-slate-500">사유를 클릭하면 아래에서 해당 row 매핑 목록을 바로 확인할 수 있습니다.</p>
          </div>
          <div className="grid gap-3">
            {reasonOptions.length ? (
              reasonOptions.map((item) => (
                <ProgressBar
                  key={item.key}
                  label={item.label}
                  count={item.count}
                  ratio={item.ratio}
                  active={item.key === selectedReasonKey}
                  onClick={() => setSelectedReasonKey(item.key)}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">사유가 입력된 BAD row가 없습니다.</p>
            )}
          </div>
        </section>

        <section className={panelClassName("p-5")}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">일별 BAD 추이</h3>
            <p className="text-sm text-slate-500">기간별 BAD 볼륨 변화를 함께 확인합니다.</p>
          </div>
          <TrendBars items={stats?.dailyStats || []} maxCount={dailyMax} />
        </section>
      </div>

      <section className={panelClassName("p-5")}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">사유별 row 매핑</h3>
            <p className="text-sm text-slate-500">
              {selectedReasonGroup
                ? `현재 선택: ${selectedReasonGroup.label} (${selectedReasonGroup.count}건)`
                : "왼쪽에서 사유를 선택해 주세요."}
            </p>
          </div>
          <button
            className={buttonClassName("secondary")}
            type="button"
            onClick={handleExportSelected}
            disabled={!selectedReasonGroup?.rows?.length}
          >
            선택 사유 CSV
          </button>
        </div>
        <RowMappingTable rows={selectedReasonGroup?.rows || []} selectedGroupLabel={selectedReasonGroup?.label || "-"} />
      </section>
    </div>
  );
}
