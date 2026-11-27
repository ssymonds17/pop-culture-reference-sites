export const CAST_TIERS = ['lead', 'major', 'supporting', 'minor'] as const

export type CastTier = (typeof CAST_TIERS)[number]

export const CAST_TIER_LABELS: Record<CastTier, string> = {
  lead: 'Lead',
  major: 'Major',
  supporting: 'Supporting',
  minor: 'Minor',
}
