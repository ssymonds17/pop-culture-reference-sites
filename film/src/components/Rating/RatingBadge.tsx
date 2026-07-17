import { getRatingColor } from '@/lib/utils'

interface RatingBadgeProps {
  rating: number
}

export default function RatingBadge({ rating }: RatingBadgeProps) {
  // Only the darkest reds need white text; the lighter tones read better with dark text
  const textColor = rating <= 2 ? 'text-white' : 'text-gray-900'

  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getRatingColor(
        rating
      )} ${textColor} font-bold text-sm ring-2 ring-black/40 shadow-md`}
    >
      {rating}
    </span>
  )
}
