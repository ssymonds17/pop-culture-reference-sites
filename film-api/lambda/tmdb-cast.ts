export const MAX_CAST = 10

export interface TmdbCastMember {
  id: number
  name: string
  character?: string
  order: number
  profile_path?: string | null
}

export const isCredited = (member: { character?: string }) =>
  !member.character?.includes("(uncredited)")

// TMDb has no lead/supporting flag, so billing order is the best proxy for who matters.
export const creditedCast = (tmdbCast: TmdbCastMember[] = []): TmdbCastMember[] =>
  tmdbCast
    .filter(isCredited)
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_CAST)
