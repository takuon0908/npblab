import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "プロ野球LABにおける個人情報の取り扱い、Cookie・アクセス解析ツール・広告配信についてのポリシーです。",
  alternates: { canonical: "/privacy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      <div className="text-sm space-y-2" style={{ color: "var(--ink-secondary)" }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-black mb-2">プライバシーポリシー</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        プロ野球LAB(以下「当サイト」)における個人情報・Cookie等の取り扱いについて、以下の通り定めます。
      </p>

      <Section title="Cookie(クッキー)について">
        <p>
          当サイトでは、ユーザーの利便性向上、アクセス状況の把握、広告配信のためにCookieを使用しています。
          Cookieはブラウザの設定により無効化できますが、その場合、当サイトの一部機能(お気に入り球団の保存等)が
          正常に利用できなくなることがあります。
        </p>
      </Section>

      <Section title="アクセス解析ツールについて">
        <p>
          当サイトでは、Googleが提供するアクセス解析ツール「Google Analytics」を利用しています。Google
          Analyticsはトラフィックデータの収集のためにCookieを使用しますが、このトラフィックデータは匿名で収集されており、
          個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが可能ですので、
          お使いのブラウザの設定をご確認ください。この規約に関して、詳しくは
          <a
            href="https://marketingplatform.google.com/about/analytics/terms/jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Googleアナリティクス利用規約
          </a>
          をご覧ください。
        </p>
      </Section>

      <Section title="広告配信について">
        <p>
          当サイトは、第三者配信の広告サービス「Google
          AdSense」を利用しています。Google等の第三者配信事業者は、Cookie(氏名・住所・メールアドレス・電話番号を含まない)を使用して、
          ユーザーが当サイトや他のサイトに過去にアクセスした情報に基づいて広告を配信することがあります。Googleが広告Cookieを使用することにより、
          当サイトや他のサイトへのアクセス情報に基づいて、Google及びそのパートナーは適切な広告をユーザーに表示できます。
        </p>
        <p>
          ユーザーは
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            広告設定
          </a>
          にアクセスすることで、パーソナライズ広告を無効にできます。またパーソナライズ広告を無効にした場合でも、
          非パーソナライズ広告は引き続き表示されます。詳細は
          <a
            href="https://policies.google.com/technologies/ads?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Google広告におけるCookieの使用
          </a>
          をご覧ください。
        </p>
      </Section>

      <Section title="アフィリエイトプログラムについて">
        <p>
          当サイトは、Amazonアソシエイト・楽天アフィリエイト等のアフィリエイトプログラムに参加しており、
          これらのプログラムを利用して収益を得ています。商品を紹介する記事内のリンクには広告(アフィリエイトリンク)が
          含まれる場合があり、リンク経由で商品が購入された場合、当サイトに紹介料が支払われることがあります。
          詳しくは
          <Link href="/about#author" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
            このサイトについて
          </Link>
          もあわせてご確認ください。
        </p>
      </Section>

      <Section title="お問い合わせフォームについて">
        <p>
          当サイトの
          <Link href="/contact" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
            お問い合わせフォーム
          </Link>
          では、お名前・メールアドレス・お問い合わせ内容をご入力いただきます。取得した情報は、お問い合わせへの
          回答以外の目的では使用しません。
        </p>
      </Section>

      <Section title="免責事項">
        <p>
          当サイトに掲載する情報について、可能な限り正確な情報を掲載するよう努めていますが、誤りや古い情報が
          含まれる場合があります。当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますので、
          あらかじめご了承ください。当サイトからリンクやバナー等によって他のサイトに移動された場合、移動先サイトで
          提供される情報・サービス等について当サイトは一切の責任を負いません。
        </p>
      </Section>

      <Section title="プライバシーポリシーの変更について">
        <p>
          当サイトは、法令に別段の定めがある場合を除き、個人情報の取扱に関する運用状況を適宜見直し、継続的な改善に
          努めます。本ポリシーの内容は、事前の予告なく変更することがあります。
        </p>
      </Section>

      <Section title="お問い合わせ">
        <p>
          本ポリシーに関するお問い合わせは
          <Link href="/contact" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
            お問い合わせフォーム
          </Link>
          からお願いいたします。
        </p>
      </Section>
    </main>
  );
}
