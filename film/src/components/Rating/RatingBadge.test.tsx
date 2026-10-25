import { render, screen } from '@testing-library/react'
import RatingBadge from './RatingBadge'

describe('RatingBadge', () => {
  it('should show the rating with its colour', () => {
    render(<RatingBadge rating={8} />)

    const badge = screen.getByText('8')
    expect(badge).toHaveClass('bg-green-700', 'text-white', 'w-10')
  })

  it('should use dark text on the lighter colours', () => {
    render(<RatingBadge rating={6} />)

    expect(screen.getByText('6')).toHaveClass('bg-yellow-400', 'text-gray-900')
  })

  it('should render larger when asked', () => {
    render(<RatingBadge rating={9} size="lg" />)

    expect(screen.getByText('9')).toHaveClass('w-16', 'text-2xl')
  })
})
