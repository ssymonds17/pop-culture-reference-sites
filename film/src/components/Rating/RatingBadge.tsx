import { getRatingColor } from '@/lib/utils'

interface RatingBadgeProps {
  rating: number
}

export default function RatingBadge({ rating }: RatingBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getRatingColor(
        rating
      )} text-white font-bold text-sm`}
    >
      {rating}
    </span>
  )
}
