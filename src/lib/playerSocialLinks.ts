// 選手個人のSNSアカウント。本人確認が取れているものだけを掲載する
// (検索で最初に出てきたアカウントを機械的に載せると、ファンアカウントや同姓同名の
// 誤りを選手本人として紹介してしまう恐れがあるため、必ず人力で確認したものだけ追加すること)
export interface PlayerSocialLinks {
  x?: string;
  instagram?: string;
}

export const PLAYER_SOCIAL_LINKS: Record<string, PlayerSocialLinks> = {
  "hawks-栗原陵矢": {
    instagram: "https://www.instagram.com/kurihara_official24/",
  },
};

export function getPlayerSocialLinks(playerId: string): PlayerSocialLinks | null {
  return PLAYER_SOCIAL_LINKS[playerId] ?? null;
}
