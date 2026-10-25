import { render, screen } from '@testing-library/react'
import ImdbRatingBox from './ImdbRatingBox'

const renderBox = (rating: number, votes = 950000) =>
  render(<ImdbRatingBox imdbId="tt0090605" rating={rating} votes={votes} filmName="Aliens (1986)" />)

describe('ImdbRatingBox', () => {
  it('should link to the film on IMDb in a new tab, named for screen readers', () => {
    renderBox(8.4)

    const box = screen.getByRole('link', { name: '8.4 950K votes on IMDb for Aliens (1986)' })
    expect(box).toHaveAttribute('href', 'https://www.imdb.com/title/tt0090605')
    expect(box).toHaveAttribute('target', '_blank')
    expect(box).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should show the rating to one decimal place, with the vote count inside the box', () => {
    renderBox(7, 1000)

    const box = screen.getByRole('link')
    expect(box).toHaveTextContent('7.0')
    expect(box).toHaveTextContent('1K votes')
  })

  it.each([
    [1.0, 'bg-red-700', 'text-white'],
    [4.9, 'bg-red-700', 'text-white'],
    [5.0, 'bg-yellow-800', 'text-white'],
    [5.9, 'bg-yellow-800', 'text-white'],
    [6.0, 'bg-yellow-400', 'text-gray-900'],
    [6.9, 'bg-yellow-400', 'text-gray-900'],
    [7.0, 'bg-green-700', 'text-white'],
    [7.9, 'bg-green-700', 'text-white'],
    [8.0, 'bg-purple-700', 'text-white'],
    [10, 'bg-purple-700', 'text-white'],
  ])('should colour a rating of %p with %s and %s', (rating, background, text) => {
    renderBox(rating)

    expect(screen.getByRole('link')).toHaveClass(background, text)
  })
})
