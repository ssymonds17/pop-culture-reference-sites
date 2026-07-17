import { Film } from "@/types"
import FilmCard from "./FilmCard"

interface FilmGridProps {
  films: Film[]
  onUpdate?: () => void
}

export default function FilmGrid({ films, onUpdate }: FilmGridProps) {
  if (films.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No films found. Try adjusting your filters.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {films.map((film) => (
        <FilmCard key={film._id} film={film} onUpdate={onUpdate} />
      ))}
    </div>
  )
}
