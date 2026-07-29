import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE_AUTHOR } from "@/lib/author";
import { siteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "このサイトについて",
  description: "プロ野球LABの運営方針、掲載情報の位置づけ、広告・アフィリエイトについてのご案内です。",
  alternates: { canonical: "/about" },
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

export default function AboutPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_AUTHOR.name,
    alternateName: SITE_AUTHOR.nickname,
    jobTitle: SITE_AUTHOR.jobTitle,
    description: SITE_AUTHOR.bio,
    image: `${siteUrl}${SITE_AUTHOR.image}`,
    url: `${siteUrl}/about#author`,
    worksFor: { "@type": "Organization", name: "プロ野球LAB" },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <h1 className="text-2xl font-bold mb-10">このサイトについて</h1>

      <section id="author" className="mb-10 scroll-mt-20">
        <h2 className="font-semibold text-lg mb-4">運営者について</h2>
        <div
          className="flex flex-col sm:flex-row items-start gap-5 p-5"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        >
          <Image
            src={SITE_AUTHOR.image}
            alt={SITE_AUTHOR.name}
            width={96}
            height={96}
            className="flex-none rounded-full object-cover"
            style={{ width: 96, height: 96 }}
          />
          <div>
            <p className="font-bold text-lg mb-0.5" style={{ fontFamily: "var(--font-shippori-mincho)" }}>
              {SITE_AUTHOR.name}({SITE_AUTHOR.nickname})
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
              {SITE_AUTHOR.jobTitle}
            </p>
            <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
              {SITE_AUTHOR.bio}
            </p>
          </div>
        </div>
      </section>

      <Section title="プロ野球LABとは">
        <p>
          プロ野球LABは、NPB(日本プロ野球)の公開データをもとに、優勝確率・タイトル獲得確率・ピタゴラス勝率・Eloレーティングなどの独自指標を算出し、試合結果やコラム記事とあわせて発信している個人運営のデータ分析サイトです。
        </p>
        <p>
          掲載している確率・指標はすべて当サイト独自の試算であり、NPBおよび各球団の公式見解・公式発表ではありません。算出方法の詳細は
          <Link href="/about/methodology" className="hover:underline" style={{ color: "var(--accent)" }}>
            算出方法についてのページ
          </Link>
          をご覧ください。
        </p>
      </Section>

      <Section title="コラム記事について">
        <p>
          コラム記事は、当サイト独自のデータ分析に基づくものと、野球用品・トレーニング・ルール解説など一般的な情報を専門メディア等を参照して整理したものの2種類があります。後者については各記事末尾の「この記事についてのお断り」に出典・注意点を明記しています。
        </p>
        <p>
          選手・球団を扱う記事では、データに基づく分析であっても選手・関係者への敬意を欠く表現を避けるよう努めています。内容に誤りがあれば、下記のお問い合わせよりご指摘ください。
        </p>
      </Section>

      <Section title="広告・アフィリエイトについて">
        <p>
          当サイトはGoogle AdSenseによる広告配信、Amazonアソシエイト・楽天アフィリエイトによるアフィリエイトプログラムを利用して収益を得ています。商品を紹介する記事内のリンクには広告(アフィリエイトリンク)が含まれる場合があり、リンク経由で商品が購入された場合、当サイトに紹介料が支払われることがあります。
        </p>
        <p>
          紹介する商品は実際の評価・仕様を確認した上で選定していますが、広告主・提携先から記事内容について事前の指示や対価を受けて記述を歪めることはありません。
        </p>
      </Section>

      <Section title="お問い合わせ">
        <p>
          記事内容の誤りのご指摘、その他ご意見・ご要望は
          <Link href="/contact" className="hover:underline" style={{ color: "var(--accent)" }}>
            お問い合わせページ
          </Link>
          からご連絡ください。
        </p>
      </Section>
    </main>
  );
}
