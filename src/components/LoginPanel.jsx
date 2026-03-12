import { useState } from "react";
import { buttonClassName, panelClassName } from "../utils/ui";

export default function LoginPanel({ onSubmit, disabled, status }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ email, password });
    setPassword("");
  }

  return (
    <section className={panelClassName("max-w-md p-6")}>
      <h2 className="text-xl font-bold text-slate-900">로그인</h2>
      <p className="mt-2 text-sm text-slate-500">Supabase 관리자 계정으로 로그인하세요.</p>

      {status?.isError && status?.message ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">로그인에 실패했습니다.</p>
          <p className="mt-1 text-sm text-rose-700">{status.message}</p>
        </div>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          <span>이메일</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          <span>비밀번호</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-100"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <button className={buttonClassName("primary")} type="submit" disabled={disabled}>
          로그인
        </button>
      </form>
    </section>
  );
}
