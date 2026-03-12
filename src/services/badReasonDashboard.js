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

function buildReasonMap() {
  const map = new Map();

  BAD_REASON_OPTIONS.forEach((label) => {
    map.set(label, { key: label, label, count: 0, ratio: 0 });
  });

  map.set(NO_REASON_BUCKET, { key: NO_REASON_BUCKET, label: "사유 미입력", count: 0, ratio: 0 });
  map.set(CUSTOM_BUCKET, { key: CUSTOM_BUCKET, label: "직접입력 사유", count: 0, ratio: 0 });

  return map;
}

function formatRatio(count, total) {
  if (!total) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

export async function fetchBadReasonRows({ supabase, dateFrom, dateTo }) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from("scrapped_document")
      .select("id, eval_reason, created_at, updated_at")
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
  const reasonMap = buildReasonMap();
  const dailyMap = new Map();
  const customMap = new Map();

  rows.forEach((row) => {
    const bucket = getReasonBucket(row.eval_reason);
    const nextReason = reasonMap.get(bucket);
    nextReason.count += 1;

    const day = String(row.created_at || "").slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);

    if (bucket === CUSTOM_BUCKET) {
      const normalizedReason = normalizeReason(row.eval_reason);
      const current = customMap.get(normalizedReason) || {
        reason: normalizedReason,
        count: 0,
        latestAt: row.updated_at || row.created_at || null
      };
      current.count += 1;

      const nextLatestAt = row.updated_at || row.created_at || null;
      if (!current.latestAt || (nextLatestAt && new Date(nextLatestAt) > new Date(current.latestAt))) {
        current.latestAt = nextLatestAt;
      }

      customMap.set(normalizedReason, current);
    }
  });

  const totalBadCount = rows.length;
  const noReasonCount = reasonMap.get(NO_REASON_BUCKET).count;
  const customReasonCount = reasonMap.get(CUSTOM_BUCKET).count;
  const withReasonCount = totalBadCount - noReasonCount;

  const reasonBreakdown = Array.from(reasonMap.values())
    .map((item) => ({
      ...item,
      ratio: formatRatio(item.count, totalBadCount)
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.label.localeCompare(b.label);
    });

  const topReasons = reasonBreakdown.filter((item) => item.count > 0).slice(0, 6);

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const customReasons = Array.from(customMap.values()).sort((a, b) => {
    const timeA = new Date(a.latestAt || 0).getTime();
    const timeB = new Date(b.latestAt || 0).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return b.count - a.count;
  });

  return {
    totalBadCount,
    withReasonCount,
    withoutReasonCount: noReasonCount,
    completionRate: formatRatio(withReasonCount, totalBadCount),
    customReasonCount,
    reasonBreakdown,
    topReasons,
    dailyStats,
    customReasons
  };
}
