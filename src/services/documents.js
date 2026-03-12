import { PAGE_SIZE, PENDING_SUBJECTS } from "../constants/review";

function buildDayStartIso(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function buildDayEndIso(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function applyDateRange(query, dateFrom, dateTo) {
  return query.gte("created_at", buildDayStartIso(dateFrom)).lte("created_at", buildDayEndIso(dateTo));
}

function applyTabFilter(query, tab) {
  if (tab === "pending") {
    return query.is("good_bad_type", null).in("subject", PENDING_SUBJECTS);
  }

  if (tab === "reviewed_good") {
    return query.eq("good_bad_type", "GOOD");
  }

  if (tab === "reviewed_bad") {
    return query.eq("good_bad_type", "BAD");
  }

  return query.not("good_bad_type", "is", null);
}

function applyReviewedFilter(query, reviewedFilter) {
  switch (reviewedFilter) {
    case "bad":
      return query;
    case "bad_no_reason":
      return query.or("eval_reason.is.null,eval_reason.eq.");
    case "bad_with_reason":
      return query.not("eval_reason", "is", null).neq("eval_reason", "");
    default:
      return query;
  }
}

function applySearchFilter(query, searchType, searchKeyword) {
  const trimmed = searchKeyword.trim();
  if (!trimmed) {
    return query;
  }

  const column = searchType === "author" ? "author" : "title";
  return query.ilike(column, `%${trimmed}%`);
}

export function createViewKey({ tab, dateFrom, dateTo, page, reviewedFilter, searchType, searchKeyword }) {
  return `${tab}::${dateFrom}::${dateTo}::${page}::${reviewedFilter}::${searchType}::${searchKeyword.trim()}`;
}

export async function fetchDocumentCounts({
  supabase,
  dateFrom,
  dateTo,
  searchType,
  searchKeyword
}) {
  const hasSearchKeyword = Boolean(searchKeyword.trim());
  const baseQuery = hasSearchKeyword
    ? (tabName) =>
        applySearchFilter(
          applyTabFilter(supabase.from("scrapped_document").select("id", { count: "exact", head: true }), tabName),
          searchType,
          searchKeyword
        )
    : (tabName) =>
        applyTabFilter(
          applyDateRange(
            supabase.from("scrapped_document").select("id", { count: "exact", head: true }),
            dateFrom,
            dateTo
          ),
          tabName
        );

  const [pendingResult, reviewedResult, reviewedGoodResult, reviewedBadResult] = await Promise.all([
    baseQuery("pending"),
    baseQuery("reviewed"),
    baseQuery("reviewed_good"),
    baseQuery("reviewed_bad")
  ]);

  return {
    pending: pendingResult.count || 0,
    reviewed: reviewedResult.count || 0,
    reviewedGood: reviewedGoodResult.count || 0,
    reviewedBad: reviewedBadResult.count || 0
  };
}

export async function fetchDocuments({
  supabase,
  tab,
  reviewedFilter,
  dateFrom,
  dateTo,
  page,
  searchType,
  searchKeyword
}) {
  const hasSearchKeyword = Boolean(searchKeyword.trim());
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  let query = hasSearchKeyword
    ? applySearchFilter(
        supabase
          .from("scrapped_document")
          .select("*", { count: "exact" })
          .order("infer_score", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        searchType,
        searchKeyword
      )
    : applyTabFilter(
        applyDateRange(
          supabase
            .from("scrapped_document")
            .select("*", { count: "exact" })
            .order("infer_score", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
          dateFrom,
          dateTo
        ),
        tab
      );

  if (!hasSearchKeyword && tab === "reviewed_bad") {
    query = applyReviewedFilter(query, reviewedFilter);
  }

  const { data, error, count } = await query.range(rangeFrom, rangeTo);
  if (error) {
    throw error;
  }

  return {
    rows: data || [],
    totalCount: count || 0
  };
}

export async function saveDocumentReviews({ supabase, drafts }) {
  const draftEntries = Object.entries(drafts);
  const failed = [];

  for (const [id, payload] of draftEntries) {
    const cleanedPayload = {
      good_bad_type: payload.good_bad_type ?? null,
      eval_reason: payload.eval_reason && payload.eval_reason.trim() ? payload.eval_reason.trim() : null
    };
    const { error } = await supabase.from("scrapped_document").update(cleanedPayload).eq("id", id);
    if (error) {
      failed.push(`${id}: ${error.message}`);
    }
  }

  return {
    failed,
    savedEntries: draftEntries
  };
}

export { PAGE_SIZE };
