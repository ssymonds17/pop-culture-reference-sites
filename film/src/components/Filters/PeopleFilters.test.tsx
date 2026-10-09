import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PeopleFilters from './PeopleFilters'

const renderFilters = (kind: 'director' | 'actor' = 'actor') => {
  const onSearch = jest.fn()
  const onReset = jest.fn()
  render(<PeopleFilters kind={kind} sortBy="totalPoints" onSearch={onSearch} onReset={onReset} />)
  return { onSearch, onReset }
}

describe('PeopleFilters', () => {
  it.each([
    ['director', 'Search directors'],
    ['actor', 'Search actors'],
  ] as const)('should label the search box for %ss', (kind, placeholder) => {
    renderFilters(kind)

    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
  })

  it('should search with the current sort on Enter or the Search button', async () => {
    const user = userEvent.setup()
    const { onSearch } = renderFilters()

    await user.type(screen.getByRole('textbox'), 'weaver{Enter}')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSearch).toHaveBeenCalledTimes(2)
    expect(onSearch).toHaveBeenNthCalledWith(1, 'weaver', 'totalPoints')
    expect(onSearch).toHaveBeenNthCalledWith(2, 'weaver', 'totalPoints')
  })

  it('should search with the chosen sort when a sort option is clicked', async () => {
    const user = userEvent.setup()
    const { onSearch } = renderFilters()

    await user.click(screen.getByRole('button', { name: 'Average Rating' }))

    expect(onSearch).toHaveBeenCalledWith('', 'averageRating')
  })

  it('should clear the search box and reset', async () => {
    const user = userEvent.setup()
    const { onReset } = renderFilters()
    await user.type(screen.getByRole('textbox'), 'weaver')

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(onReset).toHaveBeenCalled()
  })
})
