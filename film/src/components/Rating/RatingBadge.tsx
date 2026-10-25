import { getRatingColor } from '@/lib/utils'

interface RatingBadgeProps {
  rating: number
  size?: 'md' | 'lg'
}

export default function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-sm'

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClass} rounded-full ${getRatingColor(
        rating
      )} font-bold ring-2 ring-black/40 shadow-md`}
    >
      {rating}
    </span>
  )
}
