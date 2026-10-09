import { render, screen } from '@testing-library/react'
import RatingBadge from './RatingBadge'

describe('RatingBadge', () => {
  it('should show the rating with its colour', () => {
    render(<RatingBadge rating={8} />)

    const badge = screen.getByText('8')
    expect(badge).toHaveClass('bg-rating-8', 'text-gray-900', 'w-10')
  })

  it('should use white text for the darkest ratings', () => {
    render(<RatingBadge rating={2} />)

    expect(screen.getByText('2')).toHaveClass('text-white')
  })

  it('should render larger when asked', () => {
    render(<RatingBadge rating={9} size="lg" />)

    expect(screen.getByText('9')).toHaveClass('w-16', 'text-2xl')
  })
})
