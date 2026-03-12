import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_DATE_RANGE_DAYS } from "../constants/review";
import { getRelativeDateString } from "../utils/format";
import { buildBadReasonDashboard, fetchBadReasonRows } from "../services/badReasonDashboard";

export function useBadReasonDashboard({ supabase, session, config, enabled = true }) {
  const today = useMemo(() => getRelativeDateString(0), []);
  const defaultStartDate = useMemo(() => getRelativeDateString(-(DEFAULT_DATE_RANGE_DAYS - 1)), []);
  const cacheRef = useRef({});
  const [dateFrom, setDateFrom] = useState(defaultStartDate);
  const [dateTo, setDateTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", isError: false });
  const [stats, setStats] = useState(null);

  const sessionEmail = session?.user?.email || "";
  const isAllowedUser = !config?.adminEmail || sessionEmail === config.adminEmail;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!session || !supabase) {
      setStats(null);
      return;
    }

    if (!isAllowedUser) {
      setStats(null);
      setStatus({ message: "대시보드에 접근할 수 없습니다.", isError: true });
      return;
    }

    void loadStats({ force: false });
  }, [enabled, session, supabase, isAllowedUser, dateFrom, dateTo]);

  async function loadStats({ force }) {
    if (!supabase) {
      return;
    }

    if (!dateFrom || !dateTo) {
      setStats(null);
      setStatus({ message: "시작일과 종료일을 모두 선택해 주세요.", isError: true });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      setStats(null);
      setStatus({ message: "시작일은 종료일보다 늦을 수 없습니다.", isError: true });
      return;
    }

    const cacheKey = `${dateFrom}::${dateTo}`;
    if (cacheRef.current[cacheKey] && !force) {
      setStats(cacheRef.current[cacheKey]);
      setStatus({ message: "", isError: false });
      return;
    }

    setLoading(true);
    setStatus({ message: "", isError: false });

    try {
      const rows = await fetchBadReasonRows({ supabase, dateFrom, dateTo });
      const nextStats = buildBadReasonDashboard(rows);
      cacheRef.current[cacheKey] = nextStats;
      setStats(nextStats);
    } catch (error) {
      setStats(null);
      setStatus({ message: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  return {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    loading,
    status,
    stats,
    refresh: () => loadStats({ force: true })
  };
}
