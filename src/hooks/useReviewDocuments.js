import { useEffect, useMemo, useRef, useState } from "react";
import { BAD_REASON_CUSTOM, BAD_REASON_OPTIONS, SELECTED_ROW_STORAGE_KEY } from "../constants/review";
import {
  createViewKey,
  fetchDocumentCounts,
  fetchDocuments,
  PAGE_SIZE,
  saveDocumentReviews
} from "../services/documents";
import { getTodayString, rowKey } from "../utils/format";

function inferBadReasonMode(reason) {
  if (!reason) {
    return "";
  }

  if (BAD_REASON_OPTIONS.includes(reason)) {
    return reason;
  }

  return BAD_REASON_CUSTOM;
}

export function useReviewDocuments({ supabase, session, config }) {
  const today = useMemo(() => getTodayString(), []);
  const didAutoScrollRef = useRef(false);
  const cacheRef = useRef({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ message: "", isError: false });
  const [tab, setTab] = useState("pending");
  const [reviewedFilter, setReviewedFilter] = useState("bad");
  const [searchType, setSearchType] = useState("title");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [drafts, setDrafts] = useState({});
  const [badReasonModes, setBadReasonModes] = useState({});
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({ pending: 0, reviewed: 0, reviewedBad: 0 });
  const [selectedRowId, setSelectedRowId] = useState(() => {
    try {
      return window.localStorage.getItem(SELECTED_ROW_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const sessionEmail = session?.user?.email || "";
  const isAllowedUser = !config?.adminEmail || sessionEmail === config.adminEmail;

  useEffect(() => {
    setPage(1);
  }, [tab, reviewedFilter, dateFrom, dateTo, searchType, searchKeyword]);

  useEffect(() => {
    if (!session || !supabase) {
      setRows([]);
      setDrafts({});
      return;
    }

    if (!isAllowedUser) {
      setRows([]);
      setDrafts({});
      setStatus({ message: "허용되지 않은 계정입니다.", isError: true });
      return;
    }

    void loadDocuments({ force: false });
  }, [session, supabase, isAllowedUser, tab, reviewedFilter, dateFrom, dateTo, page, searchType, searchKeyword]);

  useEffect(() => {
    function handleKeydown(event) {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();
      if (session) {
        void saveAllRows();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [session, drafts, saving]);

  useEffect(() => {
    if (!selectedRowId) {
      return;
    }

    try {
      window.localStorage.setItem(SELECTED_ROW_STORAGE_KEY, String(selectedRowId));
    } catch {
    }
  }, [selectedRowId]);

  useEffect(() => {
    if (!selectedRowId || didAutoScrollRef.current) {
      return;
    }

    const rowElement = document.querySelector(`[data-row-id="${selectedRowId}"]`);
    if (rowElement) {
      rowElement.scrollIntoView({ block: "center" });
      didAutoScrollRef.current = true;
    }
  }, [rows, selectedRowId]);

  async function loadDocuments({ force }) {
    if (!supabase) {
      return;
    }

    const viewKey = createViewKey({
      tab,
      dateFrom,
      dateTo,
      page,
      reviewedFilter,
      searchType,
      searchKeyword
    });

    const cached = cacheRef.current[viewKey];
    if (cached && !force) {
      setRows(cached.rows);
      setTotalCount(cached.totalCount);
      setTabCounts(cached.tabCounts);
      setStatus({ message: "", isError: false });
      return;
    }

    setLoading(true);
    setStatus({ message: "", isError: false });
    didAutoScrollRef.current = false;

    try {
      const [documentResult, countResult] = await Promise.all([
        fetchDocuments({
          supabase,
          tab,
          reviewedFilter,
          dateFrom,
          dateTo,
          page,
          searchType,
          searchKeyword
        }),
        fetchDocumentCounts({
          supabase,
          dateFrom,
          dateTo,
          searchType,
          searchKeyword
        })
      ]);

      const nextCache = {
        rows: documentResult.rows,
        totalCount: documentResult.totalCount,
        tabCounts: countResult
      };
      cacheRef.current[viewKey] = nextCache;
      setRows(nextCache.rows);
      setTotalCount(nextCache.totalCount);
      setTabCounts(nextCache.tabCounts);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setStatus({ message: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  function draftValueForRow(row) {
    return drafts[rowKey(row.id)];
  }

  function upsertDraft(row, patch) {
    setDrafts((current) => {
      const key = rowKey(row.id);
      const next = {
        good_bad_type: patch.good_bad_type ?? current[key]?.good_bad_type ?? row.good_bad_type ?? null,
        eval_reason:
          patch.eval_reason !== undefined
            ? patch.eval_reason
            : current[key]?.eval_reason ?? row.eval_reason ?? null
      };

      const unchanged =
        (next.good_bad_type ?? null) === (row.good_bad_type ?? null) &&
        (next.eval_reason ?? null) === (row.eval_reason ?? null);

      if (unchanged) {
        const cloned = { ...current };
        delete cloned[key];
        return cloned;
      }

      return { ...current, [key]: next };
    });
  }

  function setBadReasonMode(row, mode) {
    setBadReasonModes((current) => ({
      ...current,
      [rowKey(row.id)]: mode
    }));
  }

  function handleSelectRow(id) {
    setSelectedRowId(String(id));
  }

  function handleTypeChange(row, nextValue) {
    handleSelectRow(row.id);
    const existingReason = draftValueForRow(row)?.eval_reason ?? row.eval_reason ?? null;
    const nextReason = nextValue === "GOOD" && BAD_REASON_OPTIONS.includes(existingReason) ? "" : undefined;

    if (nextValue === "BAD") {
      setBadReasonMode(row, inferBadReasonMode(existingReason));
    }

    upsertDraft(row, { good_bad_type: nextValue, eval_reason: nextReason });
  }

  function handleReasonChange(row, nextValue) {
    handleSelectRow(row.id);
    upsertDraft(row, { eval_reason: nextValue });
  }

  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const draft = drafts[rowKey(row.id)];
        if (!draft) {
          return row;
        }

        return {
          ...row,
          good_bad_type: draft.good_bad_type ?? row.good_bad_type ?? null,
          eval_reason: draft.eval_reason ?? row.eval_reason ?? null
        };
      })
      .sort((a, b) => {
        const scoreA = a.infer_score ?? Number.NEGATIVE_INFINITY;
        const scoreB = b.infer_score ?? Number.NEGATIVE_INFINITY;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [rows, drafts]);

  function handleMarkAllGood() {
    setDrafts((current) => {
      const next = { ...current };

      displayRows.forEach((row) => {
        const key = rowKey(row.id);
        const existingReason = current[key]?.eval_reason ?? row.eval_reason ?? null;
        const merged = {
          good_bad_type: "GOOD",
          eval_reason: BAD_REASON_OPTIONS.includes(existingReason) ? null : existingReason
        };
        const unchanged =
          (merged.good_bad_type ?? null) === (row.good_bad_type ?? null) &&
          (merged.eval_reason ?? null) === (row.eval_reason ?? null);

        if (unchanged) {
          delete next[key];
        } else {
          next[key] = merged;
        }
      });

      return next;
    });

    if (displayRows.length) {
      handleSelectRow(displayRows[0].id);
    }
  }

  async function saveAllRows() {
    if (!supabase || saving || !Object.keys(drafts).length) {
      if (!Object.keys(drafts).length) {
        setStatus({ message: "저장할 변경사항이 없습니다.", isError: false });
      }
      return;
    }

    setSaving(true);
    setStatus({ message: "", isError: false });

    const { failed, savedEntries } = await saveDocumentReviews({ supabase, drafts });
    if (failed.length) {
      setSaving(false);
      setStatus({ message: `저장 실패: ${failed.join(", ")}`, isError: true });
      return;
    }

    const savedIds = new Set(savedEntries.map(([id]) => id));
    setRows((current) => {
      const merged = current.map((row) => {
        const key = rowKey(row.id);
        if (!savedIds.has(key)) {
          return row;
        }

        const payload = drafts[key];
        return {
          ...row,
          good_bad_type: payload.good_bad_type ?? null,
          eval_reason: payload.eval_reason && payload.eval_reason.trim() ? payload.eval_reason.trim() : null
        };
      });

      if (tab === "pending") {
        return merged.filter((row) => !row.good_bad_type);
      }

      return merged;
    });

    setDrafts({});
    setBadReasonModes({});
    setSaving(false);
    setStatus({ message: `${savedEntries.length}건 저장되었습니다.`, isError: false });
    cacheRef.current = {};
    await loadDocuments({ force: true });
  }

  return {
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
    dirtyCount: Object.keys(drafts).length,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    handleSelectRow,
    handleTypeChange,
    handleReasonChange,
    setBadReasonMode,
    handleMarkAllGood,
    saveAllRows,
    refreshDocuments: () => loadDocuments({ force: true })
  };
}
