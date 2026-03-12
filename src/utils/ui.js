export function panelClassName(extra) {
  return `rounded-[24px] border border-white/70 bg-white shadow-panel ${extra || ""}`.trim();
}

export function buttonClassName(kind) {
  if (kind === "secondary") {
    return "rounded-full bg-pine-100 px-4 py-2.5 text-sm font-semibold text-pine-900 transition hover:-translate-y-px disabled:cursor-wait disabled:opacity-60";
  }

  if (kind === "ghost") {
    return "rounded-full px-4 py-2.5 text-sm font-semibold text-pine-900 transition hover:-translate-y-px";
  }

  return "rounded-full bg-pine-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px disabled:cursor-wait disabled:opacity-60";
}

export function getScoreTone(score) {
  if (score === null || score === undefined || score === "") {
    return "bg-slate-100 text-slate-500";
  }

  if (Number(score) >= 80) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (Number(score) >= 50) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}
