"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website"), // honeypot
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm" style={{ color: "var(--ink)" }}>
        送信しました。内容を確認の上、必要に応じてご返信します。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold mb-1">
          お名前
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          className="w-full px-3 py-2 text-sm"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-1">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          className="w-full px-3 py-2 text-sm"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-semibold mb-1">
          お問い合わせ内容
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          className="w-full px-3 py-2 text-sm"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        />
      </div>
      {/* ボット対策のhoneypot欄。実ユーザーには見えない */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="website">ウェブサイト</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="px-5 py-2 text-sm font-semibold"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {status === "sending" ? "送信中..." : "送信する"}
      </button>
      {status === "error" && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          送信に失敗しました。時間をおいて再度お試しください。
        </p>
      )}
    </form>
  );
}
