import { Film } from '@/types'
import { formatDirectorNames } from '@/lib/utils'
import RatingBadge from '../Rating/RatingBadge'

interface FilmRowProps {
  film: Film
}

export default function FilmRow({ film }: FilmRowProps) {
  return (
    <tr className="hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4">
        <div className="font-medium">{film.title}</div>
        {film.originalTitle && film.originalTitle !== film.title && (
          <div className="text-xs text-gray-500 mt-1">
            Original: {film.originalTitle}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-gray-300">{film.year}</td>
      <td className="px-6 py-4 text-gray-300">
        {film.directors && film.directors.length > 0
          ? formatDirectorNames(film.directors)
          : 'Unknown'}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {film.genres && film.genres.length > 0 ? (
            film.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
              >
                {genre}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">No genres</span>
          )}
          {film.genres && film.genres.length > 3 && (
            <span className="px-2 py-1 text-gray-500 text-xs">
              +{film.genres.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {film.watched ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
            Watched
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
            Unwatched
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {film.rating ? (
          <RatingBadge rating={film.rating} />
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {film.owned ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
            Owned
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
    </tr>
  )
}
