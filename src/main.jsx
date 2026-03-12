import React from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import App from "./App";

function renderFatalError(message) {
  const root = document.getElementById("root");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div style="padding:24px;font-family:'Noto Sans KR',sans-serif">
      <h2>런타임 에러</h2>
      <pre style="white-space:pre-wrap">${String(message)}</pre>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  renderFatalError(event.error?.stack || event.message || "Unknown error");
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  renderFatalError(reason?.stack || reason?.message || String(reason));
});

const config = window.APP_CONFIG || null;
const hasValidConfig =
  config &&
  typeof config.supabaseUrl === "string" &&
  typeof config.supabaseAnonKey === "string" &&
  config.supabaseUrl !== "https://YOUR_PROJECT.supabase.co" &&
  config.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

const supabase = hasValidConfig
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

function Root() {
  try {
    return <App config={config} hasValidConfig={hasValidConfig} supabase={supabase} />;
  } catch (error) {
    console.error(error);
    return (
      <div style={{ padding: 24, fontFamily: '"Noto Sans KR", sans-serif' }}>
        <h2>런타임 에러</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.stack || error?.message || error)}</pre>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
