import {
  formatDirectorNames,
  formatDuration,
  formatVoteCount,
  getRatingColor,
  getTmdbPosterUrl,
} from './utils'

describe('getRatingColor', () => {
  it.each([
    [1, 'bg-red-800 text-white'],
    [2, 'bg-red-600 text-white'],
    [3, 'bg-orange-600 text-gray-900'],
    [4, 'bg-orange-400 text-gray-900'],
    [5, 'bg-yellow-800 text-white'],
    [6, 'bg-yellow-400 text-gray-900'],
    [7, 'bg-lime-400 text-gray-900'],
    [8, 'bg-green-700 text-white'],
    [9, 'bg-violet-400 text-gray-900'],
    [10, 'bg-purple-700 text-white'],
  ])('should give a rating of %p its own colour, %p', (rating, classes) => {
    expect(getRatingColor(rating)).toBe(classes)
  })

  it.each([0, 11])('should fall back to grey for a rating of %p', (rating) => {
    expect(getRatingColor(rating)).toBe('bg-gray-400 text-gray-900')
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

describe('formatVoteCount', () => {
  it.each([
    [1, '1 vote'],
    [950, '950 votes'],
    [1234, '1.2K votes'],
    [15000, '15K votes'],
    [2345678, '2.3M votes'],
  ])('should format %i as %s', (count, expected) => {
    expect(formatVoteCount(count)).toBe(expected)
  })
})
