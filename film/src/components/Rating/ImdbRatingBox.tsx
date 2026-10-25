import { formatVoteCount } from '@/lib/utils'

interface ImdbRatingBoxProps {
  imdbId: string
  rating: number
  votes: number
  /** Names the film for screen readers, such as "Aliens (1986)" */
  filmName: string
}

// Every pairing keeps small text at 4.5:1 or more, which is why yellow alone takes dark text
const bandFor = (rating: number) => {
  if (rating >= 8) return 'bg-purple-700 text-white'
  if (rating >= 7) return 'bg-green-700 text-white'
  if (rating >= 6) return 'bg-yellow-400 text-gray-900'
  if (rating >= 5) return 'bg-yellow-800 text-white'
  return 'bg-red-700 text-white'
}

export default function ImdbRatingBox({ imdbId, rating, votes, filmName }: ImdbRatingBoxProps) {
  return (
    <a
      href={`https://www.imdb.com/title/${imdbId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-24 flex-col items-center rounded px-2 py-1 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-film-500 ${bandFor(rating)}`}
    >
      <span className="text-base font-bold leading-tight">{rating.toFixed(1)}</span>{' '}
      <span className="text-xs leading-tight">{formatVoteCount(votes)}</span>
      <span className="sr-only">{` on IMDb for ${filmName}`}</span>
    </a>
  )
}
