import StatusBanner from "./StatusBanner";
import { buttonClassName, panelClassName } from "../utils/ui";
import { formatDateTime } from "../utils/format";

function StatCard({ label, value, hint }) {
  return (
    <section className={panelClassName("p-5")}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </section>
  );
}

function ProgressBar({ label, count, ratio, tone = "bg-pine-600" }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-slate-500">
          {count} / {ratio.toFixed(1)}%
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${tone}`} style={{ width: `${Math.min(ratio, 100)}%` }} />
      </div>
    </div>
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
  const topReasonMax = Math.max(...(stats?.topReasons || []).map((item) => item.ratio), 0);
  const dailyMax = Math.max(...(stats?.dailyStats || []).map((item) => item.count), 0);
  const customReasonPreview = stats?.customReasons?.slice(0, 10) || [];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-amber-100 bg-amber-50/70 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700">BAD Reason Dashboard</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">BAD 사유 통계</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            기간별 BAD 건수, 사유 입력률, 카테고리 집중도, 직접입력 사유 패턴을 한 화면에서 확인합니다.
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

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          label="전체 BAD"
          value={stats ? stats.totalBadCount.toLocaleString() : "-"}
          hint="선택한 기간 내 BAD 판정 전체 건수입니다."
        />
        <StatCard
          label="사유 입력률"
          value={stats ? `${stats.completionRate.toFixed(1)}%` : "-"}
          hint={stats ? `사유 입력 ${stats.withReasonCount}건 / 미입력 ${stats.withoutReasonCount}건` : "BAD 사유 입력 비율"}
        />
        <StatCard
          label="사유 미입력"
          value={stats ? stats.withoutReasonCount.toLocaleString() : "-"}
          hint="사유 없이 저장된 BAD 건수입니다."
        />
        <StatCard
          label="직접입력 사유"
          value={stats ? stats.customReasonCount.toLocaleString() : "-"}
          hint="표준 사유 외 직접입력으로 저장된 건수입니다."
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className={panelClassName("p-5")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">상위 사유</h3>
              <p className="text-sm text-slate-500">선택한 기간에서 가장 많이 나온 BAD 사유입니다.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {stats?.topReasons?.length || 0}개 표시
            </span>
          </div>
          <div className="grid gap-4">
            {(stats?.topReasons || []).length ? (
              stats.topReasons.map((item) => (
                <ProgressBar
                  key={item.key}
                  label={item.label}
                  count={item.count}
                  ratio={item.ratio}
                  tone={item.ratio === topReasonMax ? "bg-rose-500" : "bg-pine-600"}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">표시할 사유 분포가 없습니다.</p>
            )}
          </div>
        </section>

        <section className={panelClassName("p-5")}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">사유 입력 현황</h3>
            <p className="text-sm text-slate-500">BAD 판정이 얼마나 일관되게 사유와 함께 저장되고 있는지 보여줍니다.</p>
          </div>
          <div className="grid gap-4">
            <ProgressBar
              label="사유 입력"
              count={stats?.withReasonCount || 0}
              ratio={stats?.completionRate || 0}
              tone="bg-emerald-500"
            />
            <ProgressBar
              label="사유 미입력"
              count={stats?.withoutReasonCount || 0}
              ratio={stats ? 100 - stats.completionRate : 0}
              tone="bg-amber-500"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={panelClassName("p-5")}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">일별 추이</h3>
            <p className="text-sm text-slate-500">선택한 기간 동안 날짜별 BAD 건수 추이입니다.</p>
          </div>
          <TrendBars items={stats?.dailyStats || []} maxCount={dailyMax} />
        </section>

        <section className={panelClassName("p-5")}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">전체 사유 분포</h3>
            <p className="text-sm text-slate-500">사유 미입력과 직접입력을 포함한 전체 정규화 버킷 분포입니다.</p>
          </div>
          <div className="grid gap-3">
            {(stats?.reasonBreakdown || []).map((item) => (
              <ProgressBar key={item.key} label={item.label} count={item.count} ratio={item.ratio} />
            ))}
          </div>
        </section>
      </div>

      <section className={panelClassName("p-5")}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">직접입력 사유 목록</h3>
            <p className="text-sm text-slate-500">직접입력 사유를 묶어서 최신 활동 순으로 정렬합니다.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {stats?.customReasons?.length || 0}개 그룹
          </span>
        </div>

        {customReasonPreview.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-3 py-2">사유</th>
                  <th className="px-3 py-2">건수</th>
                  <th className="px-3 py-2">최근 시각</th>
                </tr>
              </thead>
              <tbody>
                {customReasonPreview.map((item) => (
                  <tr key={item.reason} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-3 py-3">{item.reason}</td>
                    <td className="px-3 py-3 font-semibold">{item.count}</td>
                    <td className="rounded-r-2xl px-3 py-3 text-slate-500">{formatDateTime(item.latestAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">현재 기간에는 직접입력 사유가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
