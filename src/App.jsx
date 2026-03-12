import { useEffect, useMemo, useState } from "react";
import FiltersBar from "./components/FiltersBar";
import LoginPanel from "./components/LoginPanel";
import Pagination from "./components/Pagination";
import ReviewHeader from "./components/ReviewHeader";
import ReviewTable from "./components/ReviewTable";
import SavingOverlay from "./components/SavingOverlay";
import Sidebar from "./components/Sidebar";
import StatusBanner from "./components/StatusBanner";
import { useReviewDocuments } from "./hooks/useReviewDocuments";
import { rowKey } from "./utils/format";
import { buttonClassName, panelClassName } from "./utils/ui";

const TAB_LABELS = {
  pending: "미검수",
  reviewed_good: "GOOD 완료",
  reviewed_bad: "BAD 완료",
  reviewed: "전체 검수 완료"
};

function MobileQuickBar({
  tab,
  setTab,
  dirtyCount,
  saving,
  loading,
  expanded,
  onToggleExpanded,
  onMarkAllGood,
  onRefresh,
  onSaveAll
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 lg:hidden">
      <div className="mx-auto max-w-[1600px] rounded-[24px] border border-slate-200 bg-white/95 shadow-panel backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">모바일 작업 바</p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {dirtyCount ? `미저장 변경 ${dirtyCount}건` : "미저장 변경 없음"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className={buttonClassName("primary")}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSaveAll();
              }}
              disabled={saving || dirtyCount === 0}
            >
              {dirtyCount ? `저장 ${dirtyCount}` : "저장"}
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {expanded ? "접기" : "펼치기"}
            </span>
          </div>
        </button>

        {expanded ? (
          <div className="grid gap-3 border-t border-slate-200 px-4 py-3">
            <div className="grid grid-cols-4 gap-2 rounded-[20px] bg-pine-100 p-1">
              <button
                type="button"
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  tab === "pending" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
                }`}
                onClick={() => setTab("pending")}
              >
                미검수
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  tab === "reviewed_bad" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
                }`}
                onClick={() => setTab("reviewed_bad")}
              >
                BAD
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  tab === "reviewed_good" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
                }`}
                onClick={() => setTab("reviewed_good")}
              >
                GOOD
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  tab === "reviewed" ? "bg-white text-pine-900 shadow" : "text-pine-900/80"
                }`}
                onClick={() => setTab("reviewed")}
              >
                전체
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className={buttonClassName("secondary")}
                type="button"
                onClick={onMarkAllGood}
                disabled={loading || saving}
              >
                모두 GOOD
              </button>
              <button
                className={buttonClassName("secondary")}
                type="button"
                onClick={onRefresh}
                disabled={loading || saving}
              >
                새로고침
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App({ config, hasValidConfig, supabase }) {
  const [activeMenu, setActiveMenu] = useState("scrapped-document-review");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileQuickBarExpanded, setMobileQuickBarExpanded] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState({ message: "", isError: false });

  const {
    loading,
    saving,
    status,
    setStatus,
    tab,
    setTab,
    reviewedFilter,
    setReviewedFilter,
    searchType,
    setSearchType,
    searchKeyword,
    setSearchKeyword,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    drafts,
    badReasonModes,
    page,
    setPage,
    totalCount,
    tabCounts,
    selectedRowId,
    sessionEmail,
    isAllowedUser,
    displayRows,
    dirtyCount,
    totalPages,
    handleSelectRow,
    handleTypeChange,
    handleReasonChange,
    setBadReasonMode,
    handleMarkAllGood,
    saveAllRows,
    refreshDocuments
  } = useReviewDocuments({ supabase, session, config });

  useEffect(() => {
    if (!hasValidConfig || !supabase) {
      return undefined;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthStatus({ message: error.message, isError: true });
        return;
      }

      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [hasValidConfig, supabase]);

  async function handleLogin({ email, password }) {
    if (!supabase) {
      return;
    }

    setAuthLoading(true);
    setAuthStatus({ message: "", isError: false });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);

    if (error) {
      setAuthStatus({ message: error.message, isError: true });
      return;
    }

    setAuthStatus({ message: "로그인되었습니다.", isError: false });
  }

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus({ message: error.message, isError: true });
      return;
    }

    setStatus({ message: "로그아웃되었습니다.", isError: false });
  }

  const activeTabLabel = useMemo(() => TAB_LABELS[tab] || "검수", [tab]);

  if (!hasValidConfig) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <section className={panelClassName("p-6")}>
          <h2 className="text-xl font-bold text-slate-900">설정 필요</h2>
          <p className="mt-2 text-sm text-slate-500">`public/app-config.js`에 Supabase 설정을 입력해 주세요.</p>
        </section>
      </div>
    );
  }

  const visibleStatus = session ? status : authStatus;
  const showMobileQuickBar = session && isAllowedUser && activeMenu === "scrapped-document-review";
  const mobileBottomPadding = showMobileQuickBar ? (mobileQuickBarExpanded ? "pb-56" : "pb-28") : "pb-6";

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
      <SavingOverlay visible={saving} dirtyCount={dirtyCount} />
      <Sidebar
        activeMenu={activeMenu}
        onSelect={setActiveMenu}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`transition-all duration-200 ${sidebarOpen ? "lg:pl-[296px]" : ""}`}>
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            {session ? (
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => setSidebarOpen((current) => !current)}
              >
                메뉴
              </button>
            ) : null}
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-pine-700">Invest Scrap</p>
              <h1 className="text-[30px] font-bold leading-none text-slate-900 sm:text-[34px]">Web UI</h1>
            </div>
          </div>
          {session ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>{sessionEmail}</span>
              <button className={buttonClassName("ghost")} type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : null}
        </header>

        {session ? <StatusBanner status={visibleStatus} /> : null}

        {!session ? (
          <LoginPanel onSubmit={handleLogin} disabled={authLoading} status={authStatus} />
        ) : !isAllowedUser ? (
          <section className={panelClassName("p-6")}>
            <h2 className="text-xl font-bold text-slate-900">접근 불가</h2>
            <p className="mt-2 text-sm text-slate-500">관리자 이메일과 일치하지 않습니다.</p>
          </section>
        ) : (
          <section className={panelClassName(`p-4 ${mobileBottomPadding} sm:p-6 sm:pb-6`)}>
            {activeMenu === "scrapped-document-review" ? (
              <>
                <div className="mb-6 rounded-[24px] border border-pine-100 bg-pine-50/70 px-4 py-4 sm:px-5 sm:py-5">
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">스크랩 게시글 수동 검수</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    LLM이 분류한 게시글을 사람이 다시 확인해 학습용 레이블 데이터를 정제하는 작업입니다.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    subject가 일반, 매매일지, 관망글, 뉴스정리, 계좌인 문서를 우선 검수 대상으로 보여줍니다.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-pine-900 ring-1 ring-inset ring-pine-100">
                      문서를 열어 확인한 뒤 GOOD/BAD와 사유를 입력해 주세요.
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-medium ring-1 ring-inset ${
                        dirtyCount
                          ? "bg-amber-50 text-amber-800 ring-amber-200"
                          : "bg-slate-50 text-slate-500 ring-slate-200"
                      }`}
                    >
                      {dirtyCount ? `미저장 변경 ${dirtyCount}건` : "미저장 변경 없음"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                      기본 기간: 최근 7일
                    </span>
                  </div>
                </div>

                <ReviewHeader
                  dirtyCount={dirtyCount}
                  loading={loading}
                  saving={saving}
                  rowsLength={displayRows.length}
                  activeTabLabel={activeTabLabel}
                  totalCount={totalCount}
                  page={page}
                  totalPages={totalPages}
                  onMarkAllGood={handleMarkAllGood}
                  onSaveAll={saveAllRows}
                  onRefresh={refreshDocuments}
                />
                <FiltersBar
                  tab={tab}
                  setTab={setTab}
                  dateFrom={dateFrom}
                  setDateFrom={setDateFrom}
                  dateTo={dateTo}
                  setDateTo={setDateTo}
                  pendingCount={tabCounts.pending}
                  reviewedCount={tabCounts.reviewed}
                  reviewedGoodCount={tabCounts.reviewedGood}
                  reviewedBadCount={tabCounts.reviewedBad}
                  reviewedFilter={reviewedFilter}
                  setReviewedFilter={setReviewedFilter}
                  searchType={searchType}
                  setSearchType={setSearchType}
                  searchKeyword={searchKeyword}
                  setSearchKeyword={setSearchKeyword}
                />
                <ReviewTable
                  loading={loading}
                  displayRows={displayRows}
                  drafts={drafts}
                  badReasonModes={badReasonModes}
                  selectedRowId={selectedRowId}
                  rowKey={rowKey}
                  onSelect={handleSelectRow}
                  onTypeChange={handleTypeChange}
                  onBadReasonModeChange={setBadReasonMode}
                  onReasonChange={handleReasonChange}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  onPrev={() => setPage((current) => Math.max(1, current - 1))}
                  onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
                />
              </>
            ) : null}
          </section>
        )}
      </div>

      {showMobileQuickBar ? (
        <MobileQuickBar
          tab={tab}
          setTab={setTab}
          dirtyCount={dirtyCount}
          saving={saving}
          loading={loading}
          expanded={mobileQuickBarExpanded}
          onToggleExpanded={() => setMobileQuickBarExpanded((current) => !current)}
          onMarkAllGood={handleMarkAllGood}
          onRefresh={refreshDocuments}
          onSaveAll={saveAllRows}
        />
      ) : null}
    </div>
  );
}
