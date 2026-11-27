"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, EyeOff, LogOut, RefreshCw, Trash2 } from "lucide-react";

import { formatContentDate } from "../../../lib/format";
import AdminLogin from "./AdminLogin";

type ModerationStatus = "pending" | "approved" | "hidden";

interface AdminMessage {
  id: string;
  nickname: string;
  website: string;
  content: string;
  status: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
}

const tabs: Array<{ value: ModerationStatus; label: string }> = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已公开" },
  { value: "hidden", label: "已隐藏" },
];

export default function AdminGuestbookClient() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [authStatus, setAuthStatus] = useState<
    "checking" | "signed-out" | "signed-in"
  >("checking");
  const [activeStatus, setActiveStatus] =
    useState<ModerationStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/guestbook?status=all", {
        headers: { accept: "application/json" },
      });
      const data = (await response.json()) as {
        messages?: AdminMessage[];
        error?: string;
      };
      if (response.status === 401) {
        setAuthStatus("signed-out");
        throw new Error(data.error || "请先登录审核后台");
      }
      if (!response.ok) throw new Error(data.error || "无法读取留言");
      setMessages(data.messages || []);
      setAuthStatus("signed-in");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "无法读取留言");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          headers: { accept: "application/json" },
        });
        if (response.status === 401) {
          setAuthStatus("signed-out");
          setLoading(false);
          return;
        }
        if (!response.ok) throw new Error("无法检查登录状态");
        setAuthStatus("signed-in");
        await load();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "无法检查登录状态");
        setAuthStatus("signed-out");
        setLoading(false);
      }
    };
    void checkSession();
  }, []);

  const handleLoginSuccess = () => {
    setAuthStatus("signed-in");
    setError("");
    void load();
  };

  const logout = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("退出登录失败");
      setMessages([]);
      setAuthStatus("signed-out");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "退出登录失败");
    }
  };

  const counts = useMemo(
    () =>
      messages.reduce<Record<ModerationStatus, number>>(
        (result, message) => {
          result[message.status] += 1;
          return result;
        },
        { pending: 0, approved: 0, hidden: 0 },
      ),
    [messages],
  );

  const updateStatus = async (id: string, status: ModerationStatus) => {
    setError("");
    try {
      const response = await fetch(
        `/api/admin/guestbook/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (response.status === 401) {
        setAuthStatus("signed-out");
        return;
      }
      if (!response.ok) throw new Error(data.error || "操作失败");
      setMessages((current) =>
        current.map((message) =>
          message.id === id
            ? {
                ...message,
                status,
                updatedAt: new Date().toISOString(),
                approvedAt:
                  status === "approved" ? new Date().toISOString() : null,
              }
            : message,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "操作失败");
    }
  };

  const deleteMessage = async (message: AdminMessage) => {
    if (!window.confirm(`确认永久删除 ${message.nickname} 的留言？`)) return;
    setError("");
    try {
      const response = await fetch(
        `/api/admin/guestbook/${encodeURIComponent(message.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (response.status === 401) {
        setAuthStatus("signed-out");
        return;
      }
      if (!response.ok) throw new Error(data.error || "删除失败");
      setMessages((current) =>
        current.filter((item) => item.id !== message.id),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除失败");
    }
  };

  const visible = messages.filter((message) => message.status === activeStatus);

  if (authStatus === "checking") {
    return (
      <div className="glass-card mt-10 p-10 text-center text-sm text-slate-400">
        正在检查登录状态……
      </div>
    );
  }

  if (authStatus === "signed-out") {
    return (
      <>
        {error && (
          <p className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        <AdminLogin onSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
              className={`rounded-2xl px-4 py-2 text-xs font-black transition ${
                activeStatus === tab.value
                  ? "bg-indigo-500 text-white"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {tab.label} {counts[tab.value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
        >
          <RefreshCw size={14} />
          刷新
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
        >
          <LogOut size={14} />
          退出登录
        </button>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="glass-card mt-5 p-10 text-center text-sm text-slate-400">
          正在读取留言……
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card mt-5 p-10 text-center text-sm text-slate-400">
          当前分类没有留言。
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {visible.map((message) => (
            <article key={message.id} className="glass-card p-6">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-white">{message.nickname}</h2>
                  <p className="mt-1 text-[10px] font-bold text-indigo-300">
                    {formatContentDate(message.createdAt)}
                  </p>
                </div>
                {message.website && (
                  <a
                    href={message.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-xs font-bold text-indigo-300 hover:text-indigo-200"
                  >
                    留言者网站 →
                  </a>
                )}
              </header>
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                {message.content}
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
                {message.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => void updateStatus(message.id, "approved")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/85 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                  >
                    <Check size={14} />
                    批准
                  </button>
                )}
                {message.status !== "hidden" && (
                  <button
                    type="button"
                    onClick={() => void updateStatus(message.id, "hidden")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                  >
                    <EyeOff size={14} />
                    隐藏
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void deleteMessage(message)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/80 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-500"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
