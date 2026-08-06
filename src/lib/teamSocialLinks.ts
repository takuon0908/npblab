// 12球団の公式SNS・ファンクラブ。いずれも球団本体が運営する公式アカウント
// (個人選手と違って「なりすまし」のリスクがなく、複数の独立した情報源で
// 相互に確認できるため、選手SNSより確信を持って掲載できる)
export interface TeamSocialLink {
  url: string;
  handle?: string;
}

export interface TeamSocialLinks {
  x?: TeamSocialLink;
  instagram?: TeamSocialLink;
  youtube?: TeamSocialLink;
  fanclub?: TeamSocialLink;
}

export const TEAM_SOCIAL_LINKS: Record<string, TeamSocialLinks> = {
  tigers: {
    x: { url: "https://x.com/TigersDreamlink", handle: "@TigersDreamlink" },
    instagram: { url: "https://www.instagram.com/hanshintigers_official/", handle: "@hanshintigers_official" },
    youtube: { url: "https://www.youtube.com/channel/UCqm35j3ustKFyXQVnX5tlXw" },
    fanclub: { url: "https://hanshintigers.jp/fanclub/" },
  },
  giants: {
    x: { url: "https://x.com/TokyoGiants", handle: "@TokyoGiants" },
    instagram: { url: "https://www.instagram.com/tokyogiants_jp/", handle: "@tokyogiants_jp" },
    youtube: { url: "https://www.youtube.com/channel/UCXxg0igSYUp0tqdd6luPEnQ" },
  },
  baystars: {
    x: { url: "https://x.com/ydb_yokohama", handle: "@ydb_yokohama" },
    instagram: { url: "https://www.instagram.com/baystars_official/", handle: "@baystars_official" },
    youtube: { url: "https://www.youtube.com/channel/UCD7Pq1q-gCQwWXl2XtlwPQw" },
    fanclub: { url: "https://www.baystars.co.jp/fanclub/" },
  },
  dragons: {
    x: { url: "https://x.com/dragonsofficial", handle: "@dragonsofficial" },
    instagram: { url: "https://www.instagram.com/chunichidragonsofficial/", handle: "@chunichidragonsofficial" },
    youtube: { url: "https://www.youtube.com/@CHUNICHI_DRAGONS" },
    fanclub: { url: "https://dragons.jp/fanclub/" },
  },
  carp: {
    x: { url: "https://x.com/Carpofficial_pr", handle: "@Carpofficial_pr" },
    instagram: { url: "https://www.instagram.com/carp_official_2/", handle: "@carp_official_2" },
    youtube: { url: "https://www.youtube.com/channel/UC0VGvOEN22JcprH7pZrCwiw" },
    fanclub: { url: "https://www.fanclub.carp.co.jp/" },
  },
  swallows: {
    x: { url: "https://x.com/swallowspr", handle: "@swallowspr" },
    instagram: { url: "https://www.instagram.com/swallows_ys_official/", handle: "@swallows_ys_official" },
    youtube: { url: "https://www.youtube.com/user/swallows" },
    fanclub: { url: "https://www.yakult-swallows.co.jp/fanclub" },
  },
  hawks: {
    x: { url: "https://x.com/HAWKS_official", handle: "@HAWKS_official" },
    instagram: { url: "https://www.instagram.com/softbankhawks_official/", handle: "@softbankhawks_official" },
    youtube: { url: "https://www.youtube.com/channel/UCbDAmhyRx9bakv-0Gucglgg" },
    fanclub: { url: "https://www.softbankhawks.co.jp/ex/fanclub/" },
  },
  fighters: {
    x: { url: "https://x.com/fighterspr", handle: "@fighterspr" },
    instagram: { url: "https://www.instagram.com/fighters_official/", handle: "@fighters_official" },
    youtube: { url: "https://www.youtube.com/@FIGHTERSofficial" },
    fanclub: { url: "https://fanclub.fighters.co.jp/" },
  },
  buffaloes: {
    x: { url: "https://x.com/orix_buffaloes", handle: "@orix_buffaloes" },
    instagram: { url: "https://www.instagram.com/orix_buffaloes/", handle: "@orix_buffaloes" },
    youtube: { url: "https://www.youtube.com/@buffaloestv" },
    fanclub: { url: "https://www.buffaloes.co.jp/fanclub/" },
  },
  eagles: {
    x: { url: "https://x.com/Rakuten__Eagles", handle: "@Rakuten__Eagles" },
    instagram: { url: "https://www.instagram.com/rakuten_eagles/", handle: "@rakuten_eagles" },
    fanclub: { url: "https://www.rakuteneagles.jp/fanclub/entry/" },
  },
  lions: {
    x: { url: "https://x.com/lions_official", handle: "@lions_official" },
    instagram: { url: "https://www.instagram.com/saitama_seibu_lions_official/", handle: "@saitama_seibu_lions_official" },
    youtube: { url: "https://www.youtube.com/@lions" },
    fanclub: { url: "https://www.seibulions.jp/fanclub/" },
  },
  marines: {
    x: { url: "https://x.com/chibalotte", handle: "@chibalotte" },
    instagram: { url: "https://www.instagram.com/chibalotte/", handle: "@chibalotte" },
    youtube: { url: "https://www.youtube.com/c/chibalotte" },
    fanclub: { url: "https://member.team26.jp/" },
  },
};

export function getTeamSocialLinks(slug: string): TeamSocialLinks | null {
  return TEAM_SOCIAL_LINKS[slug] ?? null;
}
