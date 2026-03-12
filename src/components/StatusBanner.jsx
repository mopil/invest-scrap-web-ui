export default function StatusBanner({ status }) {
  if (!status.message) {
    return null;
  }

  return <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${status.isError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>{status.message}</div>;
}
