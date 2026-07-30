import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "プロ野球LABへのお問い合わせフォームです。誤りのご指摘・ご意見などお気軽にご連絡ください。",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-black mb-2">お問い合わせ</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        記事内容の誤りのご指摘、掲載データについてのご質問、その他ご意見・ご要望はこちらのフォームからお送りください。
        内容を確認の上、必要に応じて記載いただいたメールアドレス宛にご返信します。
      </p>
      <ContactForm />
    </main>
  );
}
