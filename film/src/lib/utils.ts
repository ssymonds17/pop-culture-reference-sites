export const getRatingColor = (rating: number): string => {
  const colors: Record<number, string> = {
    1: 'bg-rating-1',
    2: 'bg-rating-2',
    3: 'bg-rating-3',
    4: 'bg-rating-4',
    5: 'bg-rating-5',
    6: 'bg-rating-6',
    7: 'bg-rating-7',
    8: 'bg-rating-8',
    9: 'bg-rating-9',
    10: 'bg-rating-10',
  }
  return colors[rating] || 'bg-gray-400'
}

export const getRatingTextColor = (rating: number): string => {
  const colors: Record<number, string> = {
    1: 'text-rating-1',
    2: 'text-rating-2',
    3: 'text-rating-3',
    4: 'text-rating-4',
    5: 'text-rating-5',
    6: 'text-rating-6',
    7: 'text-rating-7',
    8: 'text-rating-8',
    9: 'text-rating-9',
    10: 'text-rating-10',
  }
  return colors[rating] || 'text-gray-400'
}

export const formatDirectorNames = (
  directors: Array<{ displayName?: string; name?: string }>
): string => {
  const names = directors.map((d) => d.displayName || d.name || 'Unknown')

  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} & ${names[1]}`

  // 3 or more: "name1, name2 & name3"
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1]
}

export const getTmdbPosterUrl = (posterPath: string, size: string = 'w500'): string => {
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
