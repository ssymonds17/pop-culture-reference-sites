import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PeopleTable from './PeopleTable'
import { Person } from '@/types'

jest.mock('../Modal/PersonFilmsModal', () => ({
  __esModule: true,
  default: ({ person, kind, isOpen }: { person: Person | null; kind: string; isOpen: boolean }) =>
    isOpen && person ? <div>{`${kind} films modal for ${person.displayName}`}</div> : null,
}))

const person: Person = {
  _id: 'person1',
  tmdbPersonId: '123',
  name: 'sigourney weaver',
  displayName: 'Sigourney Weaver',
  totalFilms: 4,
  seenFilms: 3,
  averageRating: 8.5,
  totalScore: 25,
  ratingCounts: {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 1,
    rating8: 1,
    rating9: 1,
    rating10: 0,
  },
  totalPoints: 19,
}

describe('PeopleTable', () => {
  it.each([
    ['director', 'No directors found.'],
    ['actor', 'No actors found.'],
  ] as const)('should say when there are no %ss', (kind, message) => {
    render(<PeopleTable people={[]} kind={kind} />)

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('should show each person with their rank and stats', () => {
    render(<PeopleTable people={[person]} kind="actor" />)

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sigourney Weaver' })).toBeInTheDocument()
    expect(screen.getByText('19')).toBeInTheDocument()
    expect(screen.getByText('8.50')).toBeInTheDocument()
  })

  it('should open the films modal for the clicked person and kind', async () => {
    const user = userEvent.setup()
    render(<PeopleTable people={[person]} kind="actor" />)

    await user.click(screen.getByRole('heading', { name: 'Sigourney Weaver' }))

    expect(screen.getByText('actor films modal for Sigourney Weaver')).toBeInTheDocument()
  })
})
