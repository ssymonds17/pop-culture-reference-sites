import { API_ENDPOINTS } from './api'

export type PersonKind = 'director' | 'actor'

interface PersonKindConfig {
  singular: string
  plural: string
  title: string
  listEndpoint: string
  detailEndpoint: (tmdbPersonId: string) => string
}

export const PERSON_KINDS: Record<PersonKind, PersonKindConfig> = {
  director: {
    singular: 'director',
    plural: 'directors',
    title: 'Directors',
    listEndpoint: API_ENDPOINTS.directors,
    detailEndpoint: API_ENDPOINTS.director,
  },
  actor: {
    singular: 'actor',
    plural: 'actors',
    title: 'Actors',
    listEndpoint: API_ENDPOINTS.actors,
    detailEndpoint: API_ENDPOINTS.actor,
  },
}
