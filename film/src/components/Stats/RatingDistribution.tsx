interface RatingDistributionProps {
  distribution: {
    rating1: number
    rating2: number
    rating3: number
    rating4: number
    rating5: number
    rating6: number
    rating7: number
    rating8: number
    rating9: number
    rating10: number
  }
}

export default function RatingDistribution({ distribution }: RatingDistributionProps) {
  const ratings = Object.entries(distribution)
    .map(([key, value]) => ({
      rating: parseInt(key.replace('rating', '')),
      count: value,
    }))
    .reverse() // Reverse to show 10 at top, 1 at bottom

  const maxCount = Math.max(...ratings.map((r) => r.count))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-6">Rating Distribution</h2>
      <div className="space-y-3">
        {ratings.map(({ rating, count }) => (
          <div key={rating} className="flex items-center">
            <div className="w-8 text-right mr-3 font-medium">{rating}</div>
            <div className="flex-1 bg-gray-800 rounded-full h-8 overflow-hidden relative">
              <div
                className="h-full bg-green-600 transition-all duration-500"
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
