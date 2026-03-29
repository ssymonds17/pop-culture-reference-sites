import { useState } from "react"
import { Director } from "@/types"
import DirectorFilmsModal from "../Modal/DirectorFilmsModal"

interface DirectorsTableProps {
  directors: Director[]
}

export default function DirectorsTable({ directors }: DirectorsTableProps) {
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(
    null,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDirectorClick = (director: Director) => {
    setSelectedDirector(director)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDirector(null)
  }
  if (directors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">No directors found.</div>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {directors.map((director, index) => (
          <div
            key={director._id}
            onClick={() => handleDirectorClick(director)}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-film-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-film-500">
                  #{index + 1}
                </span>
                <h3 className="text-xl font-bold">{director.displayName}</h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Total Points</div>
                <div className="text-2xl font-bold text-film-500">
                  {director.totalPoints}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-400">Total Films</div>
                <div className="text-lg font-semibold">{director.totalFilms}</div>
              </div>
              <div>
                <div className="text-gray-400">Seen</div>
                <div className="text-lg font-semibold">{director.seenFilms}</div>
              </div>
              <div>
                <div className="text-gray-400">Avg Rating</div>
                <div className="text-lg font-semibold text-film-400">
                  {director.averageRating
                    ? director.averageRating.toFixed(2)
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Rating Breakdown</div>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">10:</span> {director.ratingCounts.rating10}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">9:</span> {director.ratingCounts.rating9}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">8:</span> {director.ratingCounts.rating8}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">7:</span> {director.ratingCounts.rating7}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">6:</span> {director.ratingCounts.rating6}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DirectorFilmsModal
        director={selectedDirector}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}
