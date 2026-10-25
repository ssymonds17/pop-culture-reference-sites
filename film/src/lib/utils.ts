// Every pairing keeps the number at 4.5:1 contrast or more, hence dark text on the lighter colours
const RATING_COLORS: Record<number, string> = {
  1: 'bg-red-800 text-white',
  2: 'bg-red-600 text-white',
  3: 'bg-orange-600 text-gray-900',
  4: 'bg-orange-400 text-gray-900',
  5: 'bg-yellow-800 text-white',
  6: 'bg-yellow-400 text-gray-900',
  7: 'bg-lime-400 text-gray-900',
  8: 'bg-green-700 text-white',
  9: 'bg-violet-400 text-gray-900',
  10: 'bg-purple-700 text-white',
}

export const getRatingColor = (rating: number): string =>
  RATING_COLORS[rating] || 'bg-gray-400 text-gray-900'

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

const compactNumber = new Intl.NumberFormat('en-GB', { notation: 'compact' })

// Upper case explicitly, as ICU versions disagree on "1.2k" or "1.2K".
export const formatVoteCount = (count: number): string =>
  `${compactNumber.format(count).toUpperCase()} ${count === 1 ? 'vote' : 'votes'}`
