import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "算出方法について",
  description: "優勝確率・タイトル獲得確率・パワーランキングなど、当サイトの各種指標の算出方法を解説します。",
  alternates: { canonical: "/about/methodology" },
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

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">算出方法について</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        当サイトの確率・指標はすべて、公開されている試合結果・成績データをもとにした独自の分析・試算です。
        NPB公式の見解や予測ではありません。
      </p>

      <Section title="優勝確率シミュレーション">
        <p>
          残り試合すべてを、両チームの勝率から算出した「log5法」の勝利確率でモンテカルロ・シミュレーションし、
          1万回試行のうち何回優勝したかを確率として算出しています。実際の対戦カードの偏りも考慮しています。
        </p>
      </Section>

      <Section title="タイトルレース獲得確率">
        <p>
          本塁打・打点・盗塁・勝利・奪三振・セーブ・ホールドの各部門について、残り試合数と選手ごとの1試合あたりの
          平均ペースからポアソン分布で伸びしろを試算し、シミュレーション上でタイトルを獲得した割合を確率としています。
          首位打者・防御率のような比率成績は、規定打席（チーム試合数×3.1）・規定投球回（チーム試合数×1）に
          到達した選手の現在値のみを別区画で掲載しており、残り試合シミュレーションによる確率算出は行っていません。
        </p>
      </Section>

      <Section title="ピタゴラス勝率・パワーランキング(Elo)">
        <p>
          ピタゴラス勝率は、実際の勝敗ではなく総得点・総失点から算出する「実力なりの期待勝率」（Bill James式）です。
          実際の勝率との差が大きいほど、「実力以上に勝てている／実力ほど勝てていない」ことを示します。
        </p>
        <p>
          Eloレーティングは、対戦相手の強さを加味して算出するパワーランキングです。弱いチームに勝っても上がり幅は小さく、
          強いチームに勝つと大きく上がります。
        </p>
      </Section>

      <Section title="LABバリュー（1軍打者・投手の独自貢献度指数）">
        <p>
          打者と投手は成績の単位が違うため単純比較できません。そこで、打者は「OPS(出塁率+長打率)がリーグ平均を
          どれだけ上回ったか」、投手は「防御率がリーグ平均をどれだけ下回ったか」を、それぞれ出場量（打席数・投球回）で
          重みづけした上で、カテゴリ内で標準化（z-score）し、同じ物差しに乗せています。
        </p>
        <p>
          正式なWAR(Wins Above Replacement)のような厳密な貢献度算出ではなく、公開データのみで作れる簡易な近似値です。
          守備・走塁の貢献、対戦相手の強さ、球場補正などは考慮していません。打席数100・投球回30未満の選手は
          サンプルサイズが小さいため対象外としています。
        </p>
      </Section>

      <Section title="FIP・wOBA（セイバーメトリクス指標）">
        <p>
          FIP(Fielding Independent Pitching)は、守備・運に左右されにくい本塁打・四死球・奪三振だけで防御率相当の
          スケールに変換した投手指標です。定数はその時点のリーグ全体の防御率に合わせて動的に較正しています。
        </p>
        <p>
          wOBA(weighted On-Base Average)は、単打・二塁打・三塁打・本塁打・四死球を重みづけして合算する打撃指標です。
          係数は近年の分析で広く使われる近似値を採用しており、NPB固有の得点環境に合わせた厳密な較正は行っていません。
          いずれも規定打席・規定投球回に到達した選手のみが対象です。
        </p>
      </Section>

      <Section title="2軍→1軍換算（注目選手ランキング）">
        <p>
          2軍成績を、同一シーズンの1軍・2軍それぞれのリーグ平均の比率で換算した参考値です。球場補正や対戦相手の
          強さは考慮していない粗い推計であり、特定選手の昇格後の成績を保証するものではありません。
        </p>
      </Section>
    </main>
  );
}
