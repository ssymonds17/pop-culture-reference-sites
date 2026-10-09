import {
  formatDirectorNames,
  formatDuration,
  getRatingColor,
  getRatingTextColor,
  getTmdbPosterUrl,
} from './utils'

describe('getRatingColor', () => {
  it('should return the background class for a rating', () => {
    expect(getRatingColor(7)).toBe('bg-rating-7')
  })

  it('should fall back to grey for an unknown rating', () => {
    expect(getRatingColor(11)).toBe('bg-gray-400')
  })
})

describe('getRatingTextColor', () => {
  it('should return the text class for a rating', () => {
    expect(getRatingTextColor(10)).toBe('text-rating-10')
  })

  it('should fall back to grey for an unknown rating', () => {
    expect(getRatingTextColor(0)).toBe('text-gray-400')
  })
})

describe('formatDirectorNames', () => {
  it('should return an empty string for no directors', () => {
    expect(formatDirectorNames([])).toBe('')
  })

  it('should prefer the display name, then the name, then Unknown', () => {
    expect(formatDirectorNames([{ displayName: 'Agnès Varda', name: 'agnes varda' }])).toBe(
      'Agnès Varda'
    )
    expect(formatDirectorNames([{ name: 'agnes varda' }])).toBe('agnes varda')
    expect(formatDirectorNames([{}])).toBe('Unknown')
  })

  it('should join two names with an ampersand', () => {
    expect(
      formatDirectorNames([{ displayName: 'Joel Coen' }, { displayName: 'Ethan Coen' }])
    ).toBe('Joel Coen & Ethan Coen')
  })

  it('should join three or more names with commas and a final ampersand', () => {
    expect(
      formatDirectorNames([{ displayName: 'A' }, { displayName: 'B' }, { displayName: 'C' }])
    ).toBe('A, B & C')
  })
})

describe('getTmdbPosterUrl', () => {
  it('should default to the w500 size', () => {
    expect(getTmdbPosterUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
  })

  it('should use the requested size', () => {
    expect(getTmdbPosterUrl('/poster.jpg', 'w185')).toBe(
      'https://image.tmdb.org/t/p/w185/poster.jpg'
    )
  })
})

describe('formatDuration', () => {
  it.each([
    [45, '45m'],
    [120, '2h'],
    [139, '2h 19m'],
  ])('should format %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})
