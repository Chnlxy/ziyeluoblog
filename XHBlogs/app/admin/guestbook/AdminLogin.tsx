"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";

interface Turnstile {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "dark";
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !turnstileContainer.current) return;

    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || !window.turnstile || !turnstileContainer.current) return;
      widgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: setTurnstileToken,
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    };

    const existing = document.getElementById(
      "cloudflare-turnstile-script",
    ) as HTMLScriptElement | null;
    if (window.turnstile) {
      renderWidget();
    } else if (existing) {
      existing.addEventListener("load", renderWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = "cloudflare-turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!siteKey) {
      setError("登录功能尚未完成 Turnstile 配置。");
      return;
    }
    if (!turnstileToken) {
      setError("请先完成人机验证。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, turnstileToken }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "登录失败");
      setPassword("");
      onSuccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败");
      setTurnstileToken("");
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-card mx-auto mt-10 max-w-lg p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <LockKeyhole size={20} />
        </span>
        <div>
          <h2 className="text-xl font-black text-white">管理员登录</h2>
          <p className="mt-1 text-xs text-slate-400">
            登录后才能读取和审核留言。
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-xs font-bold text-slate-300">
          管理密码
          <input
            required
            type="password"
            minLength={20}
            maxLength={256}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-slate-100 outline-none transition focus:border-indigo-300/40"
          />
        </label>

        <div ref={turnstileContainer} />
        {!siteKey && (
          <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-200">
            登录系统正在配置 Cloudflare Turnstile。
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !siteKey}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "登录中……" : "登录审核后台"}
        </button>
      </form>
    </section>
  );
}
