import { PAGE_SIZE, PENDING_SUBJECTS } from '../constants/review';

function buildDayStartIso(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function buildDayEndIso(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function applyDateRange(query, dateFrom, dateTo) {
  return query
    .gte('created_at', buildDayStartIso(dateFrom))
    .lte('created_at', buildDayEndIso(dateTo));
}

function applyTabFilter(query, tab) {
  if (tab === 'pending') {
    return query.is('good_bad_type', null).in('subject', PENDING_SUBJECTS);
  }

  if (tab === 'reviewed_good') {
    return query.eq('good_bad_type', 'GOOD');
  }

  if (tab === 'reviewed_bad') {
    return query.eq('good_bad_type', 'BAD');
  }

  return query.not('good_bad_type', 'is', null);
}

function applyReviewedFilter(query, reviewedFilter) {
  switch (reviewedFilter) {
    case 'bad_no_reason':
      return query.or('eval_reason.is.null,eval_reason.eq.');
    case 'bad_with_reason':
      return query.not('eval_reason', 'is', null).neq('eval_reason', '');
    default:
      return query;
  }
}

function applySearchFilter(query, searchType, searchKeyword) {
  const trimmed = searchKeyword.trim();
  if (!trimmed) {
    return query;
  }

  const column = searchType === 'author' ? 'author' : 'title';
  return query.ilike(column, `%${trimmed}%`);
}

function applySort(query, tab) {
  if (tab === 'reviewed' || tab === 'reviewed_good' || tab === 'reviewed_bad') {
    return query
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  }

  return query
    .order('infer_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
}

function buildBaseQuery({
  supabase,
  tab,
  reviewedFilter,
  dateFrom,
  dateTo,
  searchType,
  searchKeyword,
  head = false,
}) {
  let query = supabase
    .from('scrapped_document')
    .select(head ? 'id' : '*', { count: 'exact', head });
  query = applyDateRange(query, dateFrom, dateTo);
  query = applyTabFilter(query, tab);
  query = applySearchFilter(query, searchType, searchKeyword);

  if (tab === 'reviewed_bad') {
    query = applyReviewedFilter(query, reviewedFilter);
  }

  if (!head) {
    query = applySort(query, tab);
  }

  return query;
}

export function createViewKey({
  tab,
  dateFrom,
  dateTo,
  page,
  reviewedFilter,
  searchType,
  searchKeyword,
}) {
  return `${tab}::${dateFrom}::${dateTo}::${page}::${reviewedFilter}::${searchType}::${searchKeyword.trim()}`;
}

export async function fetchDocumentCounts({
  supabase,
  dateFrom,
  dateTo,
  searchType,
  searchKeyword,
}) {
  const [pendingResult, reviewedResult, reviewedGoodResult, reviewedBadResult] =
    await Promise.all([
      buildBaseQuery({
        supabase,
        tab: 'pending',
        reviewedFilter: 'bad',
        dateFrom,
        dateTo,
        searchType,
        searchKeyword,
        head: true,
      }),
      buildBaseQuery({
        supabase,
        tab: 'reviewed',
        reviewedFilter: 'bad',
        dateFrom,
        dateTo,
        searchType,
        searchKeyword,
        head: true,
      }),
      buildBaseQuery({
        supabase,
        tab: 'reviewed_good',
        reviewedFilter: 'bad',
        dateFrom,
        dateTo,
        searchType,
        searchKeyword,
        head: true,
      }),
      buildBaseQuery({
        supabase,
        tab: 'reviewed_bad',
        reviewedFilter: 'bad',
        dateFrom,
        dateTo,
        searchType,
        searchKeyword,
        head: true,
      }),
    ]);

  return {
    pending: pendingResult.count || 0,
    reviewed: reviewedResult.count || 0,
    reviewedGood: reviewedGoodResult.count || 0,
    reviewedBad: reviewedBadResult.count || 0,
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
  searchKeyword,
}) {
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  const query = buildBaseQuery({
    supabase,
    tab,
    reviewedFilter,
    dateFrom,
    dateTo,
    searchType,
    searchKeyword,
  }).range(rangeFrom, rangeTo);

  const { data, error, count } = await query;
  if (error) {
    throw error;
  }

  return {
    rows: data || [],
    totalCount: count || 0,
  };
}

export async function saveDocumentReviews({ supabase, drafts }) {
  const draftEntries = Object.entries(drafts);
  const failed = [];
  const updatedAt = new Date().toISOString();

  for (const [id, payload] of draftEntries) {
    const cleanedPayload = {
      good_bad_type: payload.good_bad_type ?? null,
      eval_reason:
        payload.eval_reason && payload.eval_reason.trim()
          ? payload.eval_reason.trim()
          : null,
      updated_at: updatedAt,
    };
    const { error } = await supabase
      .from('scrapped_document')
      .update(cleanedPayload)
      .eq('id', id);
    if (error) {
      failed.push(`${id}: ${error.message}`);
    }
  }

  return {
    failed,
    savedEntries: draftEntries,
    updatedAt,
  };
}

export async function embedBadDocuments({ supabase }) {
  const { data, error } = await supabase.functions.invoke(
    'bad-document-embedding',
    {
      body: {},
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export { PAGE_SIZE };
