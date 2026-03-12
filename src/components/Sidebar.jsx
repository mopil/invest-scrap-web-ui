const MENU_ITEMS = [
  {
    id: "scrapped-document-review",
    label: "스크랩 게시글 평가 검토",
    description: "LLM 스코어링을 고도화하기 위한 샘플 데이터 라벨링 검토 작업입니다."
  }
];

export default function Sidebar({ activeMenu, onSelect, isOpen, onClose }) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/20"
          aria-label="사이드바 닫기"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r border-white/70 bg-white p-4 shadow-panel transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-pine-700">Invest Scrap</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Web UI</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              스크랩 기능을 메뉴 단위로 확장해 나가는 범용 투자 스크랩 UI입니다.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <nav className="grid gap-2">
          {MENU_ITEMS.map((item) => {
            const isActive = item.id === activeMenu;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-pine-200 bg-pine-50 text-pine-900 shadow-sm"
                    : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div className={`mt-1 text-xs leading-5 ${isActive ? "text-pine-700" : "text-slate-500"}`}>
                  {item.description}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
