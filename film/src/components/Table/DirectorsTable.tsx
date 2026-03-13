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
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Director
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Total Films
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Seen
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Avg Rating
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Total Points
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                10 / 9 / 8 / 7 / 6
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {directors.map((director, index) => (
              <tr
                key={director._id}
                onClick={() => handleDirectorClick(director)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-film-500">#{index + 1}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{director.displayName}</div>
                </td>
                <td className="px-6 py-4 text-center text-gray-300">
                  {director.totalFilms}
                </td>
                <td className="px-6 py-4 text-center text-gray-300">
                  {director.seenFilms}
                </td>
                <td className="px-6 py-4 text-center">
                  {director.averageRating ? (
                    <span className="font-semibold text-film-400">
                      {director.averageRating.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-film-500">
                    {director.totalPoints}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-300">
                  {director.ratingCounts.rating10} /{" "}
                  {director.ratingCounts.rating9} /{" "}
                  {director.ratingCounts.rating8} /{" "}
                  {director.ratingCounts.rating7} /{" "}
                  {director.ratingCounts.rating6}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DirectorFilmsModal
        director={selectedDirector}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
