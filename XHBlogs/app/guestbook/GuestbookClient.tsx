"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import { formatContentDate } from "../../lib/format";

interface GuestbookMessage {
  id: string;
  nickname: string;
  website: string;
  content: string;
  createdAt: string;
}

interface GuestbookResponse {
  messages: GuestbookMessage[];
  nextCursor: string | null;
}

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

export default function GuestbookClient() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [nickname, setNickname] = useState("");
  const [website, setWebsite] = useState("");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const loadMessages = async (cursor?: string | null) => {
    const isMore = Boolean(cursor);
    if (isMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const query = new URLSearchParams({ limit: "20" });
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(`/api/guestbook?${query}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("留言暂时无法加载");
      const data = (await response.json()) as GuestbookResponse;
      setMessages((current) =>
        isMore ? [...current, ...data.messages] : data.messages,
      );
      setNextCursor(data.nextCursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言暂时无法加载");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

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
    setNotice("");
    setError("");

    if (!siteKey) {
      setError("留言功能尚未完成 Turnstile 配置。");
      return;
    }
    if (!turnstileToken) {
      setError("请先完成人机验证。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nickname,
          website,
          content,
          turnstileToken,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "留言提交失败");

      setNickname("");
      setWebsite("");
      setContent("");
      setTurnstileToken("");
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
      setNotice(data.message || "留言已提交，审核后会公开展示。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "留言提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
      <header className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300">
          Guestbook
        </p>
        <h1 className="mt-3 text-4xl font-black text-white">留言墙</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          匿名的风也会留下痕迹。留言审核后会出现在这里。
        </p>
      </header>

      <section className="glass-card mx-auto mt-10 max-w-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <MessageCircle size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-white">写一条留言</h2>
            <p className="mt-1 text-xs text-slate-400">不必登录，昵称会公开显示。</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-300">
              昵称
              <input
                required
                maxLength={30}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="怎么称呼你？"
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-300/40"
              />
            </label>
            <label className="text-xs font-bold text-slate-300">
              个人网站
              <span className="ml-1 font-normal text-slate-600">选填</span>
              <input
                type="url"
                maxLength={500}
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-300/40"
              />
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-300">
            留言
            <textarea
              required
              maxLength={1000}
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="留下想说的话……"
              className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-300/40"
            />
          </label>

          <div ref={turnstileContainer} />
          {!siteKey && (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-200">
              留言系统正在配置 Cloudflare Turnstile。
            </p>
          )}

          {notice && (
            <p className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs text-emerald-200">
              {notice}
            </p>
          )}
          {error && (
            <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-xs text-rose-200">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !siteKey}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? "提交中" : "提交留言"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
              Messages
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">大家的痕迹</h2>
          </div>
          <p className="text-xs text-slate-500">{messages.length} 条公开留言</p>
        </div>

        {loading ? (
          <div className="glass-card p-10 text-center text-sm text-slate-400">
            正在读取留言……
          </div>
        ) : messages.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-lg font-black text-white">还没有公开留言</p>
            <p className="mt-2 text-sm text-slate-400">来留下第一句话吧。</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2">
            {messages.map((message) => (
              <article
                key={message.id}
                className="glass-card mb-4 break-inside-avoid p-6"
              >
                <header className="flex items-center justify-between gap-4">
                  <h3 className="font-black text-white">{message.nickname}</h3>
                  <time
                    dateTime={message.createdAt}
                    className="text-[10px] font-bold text-indigo-300"
                  >
                    {formatContentDate(message.createdAt)}
                  </time>
                </header>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                  {message.content}
                </p>
                {message.website && (
                  <a
                    href={message.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 inline-flex text-xs font-bold text-indigo-300 hover:text-indigo-200"
                  >
                    访问留言者网站 →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}

        {nextCursor && (
          <div className="mt-6 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadMessages(nextCursor)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {loadingMore ? "加载中……" : "加载更多"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
