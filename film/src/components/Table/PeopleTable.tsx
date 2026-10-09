import { useState } from "react"
import { Person } from "@/types"
import { PERSON_KINDS, PersonKind } from "@/lib/personKinds"
import PersonFilmsModal from "../Modal/PersonFilmsModal"

interface PeopleTableProps {
  people: Person[]
  kind: PersonKind
}

export default function PeopleTable({ people, kind }: PeopleTableProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPerson(null)
  }
  if (people.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No {PERSON_KINDS[kind].plural} found.
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {people.map((person, index) => (
          <div
            key={person._id}
            onClick={() => handlePersonClick(person)}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-film-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-film-500">
                  #{index + 1}
                </span>
                <h3 className="text-xl font-bold">{person.displayName}</h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Total Points</div>
                <div className="text-2xl font-bold text-film-500">
                  {person.totalPoints}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-400">Total Films</div>
                <div className="text-lg font-semibold">{person.totalFilms}</div>
              </div>
              <div>
                <div className="text-gray-400">Seen</div>
                <div className="text-lg font-semibold">{person.seenFilms}</div>
              </div>
              <div>
                <div className="text-gray-400">Avg Rating</div>
                <div className="text-lg font-semibold text-film-400">
                  {person.averageRating
                    ? person.averageRating.toFixed(2)
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Rating Breakdown</div>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">10:</span> {person.ratingCounts.rating10}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">9:</span> {person.ratingCounts.rating9}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">8:</span> {person.ratingCounts.rating8}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">7:</span> {person.ratingCounts.rating7}
                  </span>
                  <span className="text-gray-300">
                    <span className="font-semibold text-film-400">6:</span> {person.ratingCounts.rating6}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PersonFilmsModal
        person={selectedPerson}
        kind={kind}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}
