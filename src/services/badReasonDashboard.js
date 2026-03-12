import { BAD_REASON_OPTIONS } from "../constants/review";

const BATCH_SIZE = 1000;
const NO_REASON_BUCKET = "no_reason";
const CUSTOM_BUCKET = "custom";

function buildDayStartIso(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function buildDayEndIso(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function normalizeReason(value) {
  return String(value ?? "").trim();
}

function getReasonBucket(reason) {
  const normalizedReason = normalizeReason(reason);
  if (!normalizedReason) {
    return NO_REASON_BUCKET;
  }

  if (BAD_REASON_OPTIONS.includes(normalizedReason)) {
    return normalizedReason;
  }

  return CUSTOM_BUCKET;
}

function getReasonLabel(bucket) {
  if (bucket === NO_REASON_BUCKET) {
    return "사유 미입력";
  }

  if (bucket === CUSTOM_BUCKET) {
    return "직접입력 사유";
  }

  return bucket;
}

function formatRatio(count, total) {
  if (!total) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

function sortRowsByLatest(a, b) {
  const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
  const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
  return timeB - timeA;
}

export async function fetchBadReasonRows({ supabase, dateFrom, dateTo }) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from("scrapped_document")
      .select("id, title, subject, author, board_id, document_id, infer_score, eval_reason, created_at, updated_at")
      .eq("good_bad_type", "BAD")
      .gte("created_at", buildDayStartIso(dateFrom))
      .lte("created_at", buildDayEndIso(dateTo))
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return rows;
}

export function buildBadReasonDashboard(rows) {
  const dailyMap = new Map();
  const reasonGroupMap = new Map();

  rows.forEach((row) => {
    const normalizedReason = normalizeReason(row.eval_reason);
    const bucket = getReasonBucket(row.eval_reason);
    const group = reasonGroupMap.get(bucket) || {
      key: bucket,
      label: getReasonLabel(bucket),
      count: 0,
      ratio: 0,
      rows: []
    };

    group.count += 1;
    group.rows.push({
      id: row.id,
      title: row.title || row.subject || "제목 없음",
      subject: row.subject || "",
      author: row.author || "",
      boardId: row.board_id || "",
      documentId: row.document_id || "",
      inferScore: row.infer_score,
      rawReason: normalizedReason || "",
      mappedReason: group.label,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    });
    reasonGroupMap.set(bucket, group);

    const day = String(row.created_at || "").slice(0, 10);
    if (day) {
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    }
  });

  const totalBadCount = rows.length;
  const reasonGroups = Array.from(reasonGroupMap.values())
    .map((group) => ({
      ...group,
      ratio: formatRatio(group.count, totalBadCount),
      rows: group.rows.sort(sortRowsByLatest)
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.label.localeCompare(b.label, "ko");
    });

  const noReasonGroup = reasonGroups.find((group) => group.key === NO_REASON_BUCKET) || null;
  const mappedReasonGroups = reasonGroups.filter((group) => group.key !== NO_REASON_BUCKET);
  const mappedRowsCount = mappedReasonGroups.reduce((sum, group) => sum + group.count, 0);
  const customReasonGroup = reasonGroups.find((group) => group.key === CUSTOM_BUCKET) || null;

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalBadCount,
    mappedRowsCount,
    noReasonCount: noReasonGroup?.count || 0,
    customReasonCount: customReasonGroup?.count || 0,
    reasonGroups,
    mappedReasonGroups,
    dailyStats
  };
}
