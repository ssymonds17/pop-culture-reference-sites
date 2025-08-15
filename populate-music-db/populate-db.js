const fs = require("fs")
const csv = require("csv-parser")
const axios = require("axios")

// Configuration - Replace with your actual API base URL
const API_BASE_URL = "<replace with base url>"
// Rate limiting to avoid overwhelming the API
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function readCSV(filePath) {
  const results = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}

function extractYear(releaseDate) {
  return parseInt(releaseDate)
}

async function createArtist(artistName) {
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

async function searchArtist(artistName) {
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

async function searchAlbum(albumTitle) {
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

async function createAlbum(albumData) {
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

async function createSong(songData) {
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

async function processCSV() {
  try {
    console.log("Reading CSV file...")
    const data = await readCSV("<replace with path to your CSV file>")
    console.log(`Found ${data.length} records in CSV`)

    // Step 1: Extract and deduplicate artists
    console.log("\n=== STEP 1: Processing Artists ===")
    const uniqueArtists = [...new Set(data.map((row) => row["Artist Name(s)"]))]
    console.log(`Found ${uniqueArtists.length} unique artists`)

    const createdArtists = []
    for (const artistName of uniqueArtists) {
      try {
        await createArtist(artistName)
        createdArtists.push(artistName)
        await delay(500) // Rate limiting
      } catch (error) {
        console.error(`Skipping artist ${artistName} due to error`)
      }
    }
    console.log(`Successfully created ${createdArtists.length} artists`)

    // Step 2: Extract and deduplicate albums
    console.log("\n=== STEP 2: Processing Albums ===")
    const albumMap = new Map()

    // Create unique albums with their associated artist and year
    data.forEach((row) => {
      const albumTitle = row["Album Name"]
      const artistName = row["Artist Name(s)"]
      const year = extractYear(row["Release Date"])

      const albumKey = `${albumTitle}|${artistName}`
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, {
          title: albumTitle,
          artistName: artistName,
          year: year,
        })
      }
    })

    console.log(`Found ${albumMap.size} unique albums`)

    const createdAlbums = []
    for (const albumInfo of albumMap.values()) {
      try {
        // Search for the artist to get their ID
        const { result } = await searchArtist(albumInfo.artistName)
        if (!result || result.length === 0) {
          console.log(
            `Could not find artist ${albumInfo.artistName} for album ${albumInfo.title}`
          )
          continue
        }

        const artist = result.find(
          (a) => a.name.toLowerCase() === albumInfo.artistName.toLowerCase()
        )

        if (!artist) {
          console.error(
            `Could not match artist ${albumInfo.artistName} for album ${albumInfo.title}`
          )
          continue
        }

        const albumData = {
          title: albumInfo.title,
          artistDisplayName: artist.displayName,
          artists: [artist._id],
          year: albumInfo.year,
          rating: "NONE",
        }

        await createAlbum(albumData)
        createdAlbums.push(albumInfo.title)
        await delay(500) // Rate limiting
      } catch (error) {
        console.error(`Skipping album ${albumInfo.title} due to error`)
      }
    }
    console.log(`Successfully created ${createdAlbums.length} albums`)

    // Step 3: Create songs
    console.log("\n=== STEP 3: Processing Songs ===")
    let createdSongsCount = 0

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      try {
        console.log(
          `Processing song ${i + 1}/${data.length}: ${row["Track Name"]}`
        )

        const songTitle = row["Track Name"]
        const artistName = row["Artist Name(s)"]
        const albumTitle = row["Album Name"]
        const year = extractYear(row["Release Date"])

        // Search for artist
        const { result: artistSearchResult } = await searchArtist(artistName)
        if (!artistSearchResult || artistSearchResult.length === 0) {
          console.error(
            `Could not find artist ${artistName} for song ${songTitle}`
          )
          continue
        }

        const artist = artistSearchResult.find(
          (a) => a.name.toLowerCase() === artistName.toLowerCase()
        )

        if (!artist) {
          console.error(
            `Could not match artist ${artistName} for song ${songTitle}`
          )
          continue
        }

        // Search for album
        const { result: albumSearchResult } = await searchAlbum(albumTitle)
        if (!albumSearchResult || albumSearchResult.length === 0) {
          console.error(
            `Could not find album ${albumTitle} for song ${songTitle}`
          )
          continue
        }

        const album = albumSearchResult.find(
          (a) => a.title.toLowerCase() === albumTitle.toLowerCase()
        )

        if (!album) {
          console.error(
            `Could not match album ${albumTitle} for song ${songTitle}`
          )
          continue
        }

        const songData = {
          title: songTitle,
          artists: [artist._id],
          artistDisplayName: artistName,
          album: album._id,
          albumDisplayTitle: albumTitle,
          year: year,
        }

        await createSong(songData)
        createdSongsCount++
        await delay(500) // Rate limiting
      } catch (error) {
        console.error(`Skipping song ${row["Track Name"]} due to error`)
      }
    }

    console.log(`Successfully created ${createdSongsCount} songs`)
    console.log("\n=== SUMMARY ===")
    console.log(
      `Artists created: ${createdArtists.length}/${uniqueArtists.length}`
    )
    console.log(`Albums created: ${createdAlbums.length}/${albumMap.size}`)
    console.log(`Songs created: ${createdSongsCount}/${data.length}`)
    console.log("\n✅ Database population completed!")
  } catch (error) {
    console.error("Error processing CSV:", error)
  }
}

// Check if API base URL is configured
if (API_BASE_URL === "https://your-api-gateway-url.amazonaws.com") {
  console.error(
    "⚠️  Please update the API_BASE_URL in this script with your actual API Gateway URL"
  )
  process.exit(1)
}

// Run the script
processCSV().catch(console.error)
