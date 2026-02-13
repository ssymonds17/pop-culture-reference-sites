'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { FilmFilters, DirectorSortOption } from '@/types'

interface FilmState {
  dataRefreshRequired: boolean
  selectedFilters: FilmFilters
  selectedDirectorSort: DirectorSortOption
}

interface FilmContextValue extends FilmState {
  setDataRefreshRequired: (required: boolean) => void
  setSelectedFilters: (filters: FilmFilters) => void
  setSelectedDirectorSort: (sort: DirectorSortOption) => void
  resetFilters: () => void
}

const defaultState: FilmState = {
  dataRefreshRequired: false,
  selectedFilters: {},
  selectedDirectorSort: 'totalPoints',
}

const FilmContext = createContext<FilmContextValue | undefined>(undefined)

export const FilmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FilmState>(defaultState)

  const setDataRefreshRequired = (required: boolean) => {
    setState((prev) => ({ ...prev, dataRefreshRequired: required }))
  }

  const setSelectedFilters = (filters: FilmFilters) => {
    setState((prev) => ({ ...prev, selectedFilters: filters }))
  }

  const setSelectedDirectorSort = (sort: DirectorSortOption) => {
    setState((prev) => ({ ...prev, selectedDirectorSort: sort }))
  }

  const resetFilters = () => {
    setState((prev) => ({ ...prev, selectedFilters: {} }))
  }

  const value: FilmContextValue = {
    ...state,
    setDataRefreshRequired,
    setSelectedFilters,
    setSelectedDirectorSort,
    resetFilters,
  }

  return <FilmContext.Provider value={value}>{children}</FilmContext.Provider>
}

export const useFilmContext = () => {
  const context = useContext(FilmContext)
  if (context === undefined) {
    throw new Error('useFilmContext must be used within a FilmProvider')
  }
  return context
}
