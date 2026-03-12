import { useEffect, useState } from "react";
import FiltersBar from "./components/FiltersBar";
import LoginPanel from "./components/LoginPanel";
import Pagination from "./components/Pagination";
import ReviewHeader from "./components/ReviewHeader";
import ReviewTable from "./components/ReviewTable";
import SavingOverlay from "./components/SavingOverlay";
import StatusBanner from "./components/StatusBanner";
import { useReviewDocuments } from "./hooks/useReviewDocuments";
import { rowKey } from "./utils/format";
import { buttonClassName, panelClassName } from "./utils/ui";

export default function App({ config, hasValidConfig, supabase }) {
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

  if (!hasValidConfig) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <section className={panelClassName("p-6")}>
          <h2 className="text-xl font-bold text-slate-900">설정 필요</h2>
          <p className="mt-2 text-sm text-slate-500">`public/app-config.js`에 Supabase 설정을 입력하세요.</p>
        </section>
      </div>
    );
  }

  const visibleStatus = session ? status : authStatus;

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
      <SavingOverlay visible={saving} />
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-pine-700">Admin</p>
          <h1 className="text-[30px] font-bold leading-none text-slate-900 sm:text-[34px]">Scrapped Document Review</h1>
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

      <StatusBanner status={visibleStatus} />

      {!session ? (
        <LoginPanel onSubmit={handleLogin} disabled={authLoading} />
      ) : !isAllowedUser ? (
        <section className={panelClassName("p-6")}>
          <h2 className="text-xl font-bold text-slate-900">접근 불가</h2>
          <p className="mt-2 text-sm text-slate-500">관리자 이메일과 일치하지 않습니다.</p>
        </section>
      ) : (
        <section className={panelClassName("p-5 sm:p-6")}>
          <ReviewHeader
            dirtyCount={dirtyCount}
            loading={loading}
            saving={saving}
            rowsLength={displayRows.length}
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
        </section>
      )}
    </div>
  );
}
