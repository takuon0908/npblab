// 選手個人のSNS・ファンクラブ・Wikipedia。
// SNS/ファンクラブは本人確認が取れているものだけを掲載する
// (検索で最初に出てきたアカウントを機械的に載せると、ファンアカウントや同姓同名の
// 誤りを選手本人として紹介してしまう恐れがあるため、必ず人力で確認したものだけ追加すること)。
// Wikipediaは「なりすまし」の心配はないが、同姓同名の別人の記事を誤って結びつけない
// よう、球団・背番号・生年月日などをDBの選手データと突き合わせてから追加すること。
//
// handleはURLから自動抽出せず、表示したい文字列をそのまま持たせる
// (YouTubeのチャンネルURLは/@handle・/channel/ID・/cなど形式がバラバラで、
// URLパースだけでは綺麗な表示名にならないため。ファンクラブ・Wikipediaはhandle不要)
export interface SocialLink {
  url: string;
  handle?: string;
}

export interface PlayerSocialLinks {
  x?: SocialLink;
  instagram?: SocialLink;
  youtube?: SocialLink;
  fanclub?: SocialLink;
  wikipedia?: SocialLink;
}

export const PLAYER_SOCIAL_LINKS: Record<string, PlayerSocialLinks> = {
  "hawks-栗原陵矢": {
    instagram: { url: "https://www.instagram.com/kurihara_official24/", handle: "@kurihara_official24" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/栗原陵矢" },
  },
  "hawks-近藤健介": {
    instagram: { url: "https://www.instagram.com/kensuke89kondoh/", handle: "@kensuke89kondoh" },
    youtube: { url: "https://www.youtube.com/@konchanbase", handle: "@konchanbase" },
    fanclub: { url: "https://kensuke-kondoh.bitfan.id/" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/近藤健介" },
  },
  "tigers-森下翔太": {
    instagram: { url: "https://www.instagram.com/shota.morishita0814/", handle: "@shota.morishita0814" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/森下翔太" },
  },
  "fighters-レイエス": {
    instagram: { url: "https://www.instagram.com/franmilreyes34/", handle: "@franmilreyes34" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/フランミル・レイエス" },
  },
  "tigers-佐藤輝明": {
    instagram: { url: "https://www.instagram.com/teruaki_sato_8/", handle: "@teruaki_sato_8" },
    fanclub: { url: "https://teruaki-sato.com/" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/佐藤輝明" },
  },
  "giants-ダルベック": {
    x: { url: "https://x.com/bobbydalbec", handle: "@bobbydalbec" },
    instagram: { url: "https://www.instagram.com/bobbydalbec/", handle: "@bobbydalbec" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/ボビー・ダルベック" },
  },
  "hawks-周東佑京": {
    instagram: { url: "https://www.instagram.com/ukyoshuto23/", handle: "@ukyoshuto23" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/周東佑京" },
  },
  "giants-浦田俊輔": {
    instagram: { url: "https://www.instagram.com/urasyun____32/", handle: "@urasyun____32" },
    wikipedia: { url: "https://ja.wikipedia.org/wiki/浦田俊輔" },
  },
};

export function getPlayerSocialLinks(playerId: string): PlayerSocialLinks | null {
  return PLAYER_SOCIAL_LINKS[playerId] ?? null;
}
