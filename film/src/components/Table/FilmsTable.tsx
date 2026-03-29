import { Film } from '@/types'
import FilmRow from './FilmRow'

interface FilmsTableProps {
  films: Film[]
  onUpdate?: () => void
}

export default function FilmsTable({ films, onUpdate }: FilmsTableProps) {
  if (films.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No films found. Try adjusting your filters.
      </div>
    )
  }

  const gridCols = "80px minmax(150px,1fr) minmax(120px,180px) 90px minmax(100px,140px) auto 120px"

  return (
    <>
      {/* Mobile: Card layout */}
      <div className="md:hidden grid gap-4 grid-cols-1">
        {films.map((film) => (
          <FilmRow key={film._id} film={film} onUpdate={onUpdate} viewMode="mobile" />
        ))}
      </div>

      {/* Desktop: Grid layout with aligned columns */}
      <div className="hidden md:grid md:gap-4" style={{ gridTemplateColumns: gridCols }}>
        {films.map((film) => (
          <FilmRow key={film._id} film={film} onUpdate={onUpdate} viewMode="desktop" gridCols={gridCols} />
        ))}
      </div>
    </>
  )
}
