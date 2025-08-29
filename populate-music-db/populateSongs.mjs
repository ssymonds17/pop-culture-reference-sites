import {
  API_BASE_URL,
  readCSV,
  extractYear,
  searchArtist,
  searchAlbum,
  createSong,
} from "./utils.mjs"

async function populateSongs() {
  try {
    console.log("Reading CSV file...")
    const newData = await readCSV("50s_formatted.csv")
    console.log(`Found ${newData.length} records in CSV`)

    // Step 3: Create songs
    console.log("\n=== STEP 3: Processing Songs ===")
    let createdSongsCount = 0
    const failedSongs = []

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
        console.error(`Skipping song ${row["Track Name"]} due to error`, error)
        failedSongs.push(songTitle)
      }
    }

    console.log(`Successfully created ${createdSongsCount} songs`)

    console.log("\n=== SUMMARY ===")
    console.log(`Songs created: ${createdSongsCount}/${data.length}`)
    if (failedSongs.length > 0) {
      const failedFile = "failed_songs.txt"
      fs.writeFileSync(failedFile, failedSongs.join("\n"), "utf-8")
      console.log(`\n❌ Failed song names written to ${failedFile}`)
    }
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
populateSongs().catch(console.error)
