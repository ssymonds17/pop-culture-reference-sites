import { getRatingColor } from '@/lib/utils'

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
  const ratings = Object.entries(distribution).map(([key, value]) => ({
    rating: parseInt(key.replace('rating', '')),
    count: value,
  }))

  const maxCount = Math.max(...ratings.map((r) => r.count))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-6">Rating Distribution</h2>
      <div className="space-y-3">
        {ratings.map(({ rating, count }) => (
          <div key={rating} className="flex items-center">
            <div className="w-8 text-right mr-3 font-medium">{rating}</div>
            <div className="flex-1 bg-gray-800 rounded-full h-8 overflow-hidden">
              <div
                className={`h-full ${getRatingColor(rating)} flex items-center justify-end px-3 transition-all duration-500`}
                style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
              >
                {count > 0 && (
                  <span className="text-white font-semibold text-sm">{count}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
