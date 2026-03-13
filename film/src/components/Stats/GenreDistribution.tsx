interface GenreDistributionProps {
  genres: Array<{
    genre: string
    count: number
  }>
}

export default function GenreDistribution({ genres }: GenreDistributionProps) {
  const topGenres = genres.slice(0, 10)
  const maxCount = topGenres.length > 0 ? topGenres[0].count : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-6">Top Genres</h2>
      <div className="space-y-3">
        {topGenres.map(({ genre, count }) => (
          <div key={genre} className="flex items-center">
            <div className="w-24 text-right mr-3 font-medium truncate text-sm">
              {genre}
            </div>
            <div className="flex-1 bg-gray-800 rounded-full h-8 overflow-hidden relative">
              <div
                className="h-full bg-film-600 transition-all duration-500"
                style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
              />
              <span className={`absolute inset-0 flex items-center justify-end px-3 font-semibold text-sm ${count === 0 ? 'text-gray-500' : 'text-white'}`}>
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
