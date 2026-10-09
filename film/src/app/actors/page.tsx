'use client'

import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import PeopleRankings from '@/components/People/PeopleRankings'

export default function ActorsPage() {
  return (
    <ProtectedRoute>
      <PeopleRankings kind="actor" />
    </ProtectedRoute>
  )
}
