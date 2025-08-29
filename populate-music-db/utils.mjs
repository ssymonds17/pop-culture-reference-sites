// Configuration - Replace with your actual API base URL
export const API_BASE_URL = process.env.BASE_URL
// Rate limiting to avoid overwhelming the API
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

import fs from "fs"
import csv from "csv-parser"
import axios from "axios"

export async function readCSV(filePath) {
  const results = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}

export function extractYear(releaseDate) {
  return parseInt(releaseDate)
}

export async function createArtist(artistName) {
  try {
    console.log(`Creating artist: ${artistName}`)
    const response = await axios.post(`${API_BASE_URL}/artist`, {
      name: artistName,
    })
    console.log(`✓ Created artist: ${artistName}`)
    return response.data
  } catch (error) {
    console.error(
      `✗ Failed to create artist ${artistName}:`,
      error.response?.data || error.message
    )
    throw error
  }
}

export async function searchArtist(artistName) {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: {
        searchString: artistName,
        itemType: "artist",
      },
    })
    return response.data
  } catch (error) {
    console.error(
      `Failed to search for artist ${artistName}:`,
      error.response?.data || error.message
    )
    throw error
  }
}

export async function searchAlbum(albumTitle) {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: {
        searchString: albumTitle,
        itemType: "album",
      },
    })
    return response.data
  } catch (error) {
    console.error(
      `Failed to search for album ${albumTitle}:`,
      error.response?.data || error.message
    )
    throw error
  }
}

export async function createAlbum(albumData) {
  try {
    console.log(`Creating album: ${albumData.title}`)
    const response = await axios.post(`${API_BASE_URL}/album`, albumData)
    console.log(`✓ Created album: ${albumData.title}`)
    return response.data
  } catch (error) {
    console.error(
      `✗ Failed to create album ${albumData.title}:`,
      error.response?.data || error.message
    )
    throw error
  }
}

export async function createSong(songData) {
  try {
    console.log(`Creating song: ${songData.title}`)
    const response = await axios.post(`${API_BASE_URL}/song`, songData)
    console.log(`✓ Created song: ${songData.title}`)
    return response.data
  } catch (error) {
    console.error(
      `✗ Failed to create song ${songData.title}:`,
      error.response?.data || error.message
    )
    throw error
  }
}
