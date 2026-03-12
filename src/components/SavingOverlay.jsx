export default function SavingOverlay({ visible }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-[1px]">
      <div className="rounded-[24px] bg-white px-6 py-5 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-pine-200 border-t-pine-700" />
          <div>
            <p className="text-sm font-semibold text-slate-900">저장 중입니다</p>
            <p className="text-sm text-slate-500">잠시만 기다려 주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
