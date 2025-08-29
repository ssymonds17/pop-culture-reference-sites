import {
  API_BASE_URL,
  readCSV,
  delay,
  extractYear,
  searchArtist,
  createAlbum,
  formatArtistNames,
  splitNames,
} from "./utils.mjs"

const handleUniqueAlbums = async (albumMap) => {
  const createdAlbums = []
  const failedAlbums = []
  for (const albumInfo of albumMap.values()) {
    const artistIds = []
    try {
      // Search for the artist to get their ID
      for (const albumArtist of albumInfo.artists) {
        console.log(`Searching for artist: ${albumArtist}`)
        try {
          const { result } = await searchArtist(albumArtist)
          if (!result || result.length === 0) {
            console.log(
              `Could not find artist ${albumArtist} for album ${albumInfo.title}`
            )
            continue
          }

          const artist = result.find(
            (a) => a.name.toLowerCase() === albumArtist.toLowerCase()
          )

          if (!artist) {
            console.error(
              `Could not match artist ${albumArtist} for album ${albumInfo.title}`
            )
            continue
          }

          artistIds.push(artist._id)
        } catch (error) {
          console.error(`Error searching for artist ${albumArtist}:`, error)
        }
      }

      const albumData = {
        title: albumInfo.title,
        artistDisplayName: albumInfo.artistName,
        artists: artistIds,
        year: albumInfo.year,
        rating: "NONE",
      }

      await createAlbum(albumData)
      createdAlbums.push(albumInfo.title)
      await delay(500) // Rate limiting
    } catch (error) {
      console.error(`Skipping album ${albumInfo.title} due to error`, error)
      failedAlbums.push(albumInfo.title)
    }
  }

  return { createdAlbums, failedAlbums }
}

async function populateAlbums() {
  try {
    console.log("Reading CSV file...")
    const newData = await readCSV("50s_formatted.csv")
    console.log(`Found ${newData.length} records in CSV`)

    // Step 2: Extract and deduplicate albums
    console.log("\n=== STEP 2: Processing Albums ===")
    const albumMap = new Map()

    // Create unique albums with their associated artist and year
    newData.forEach((row) => {
      const albumTitle = row["Album Name"]
      const formattedArtistNames = formatArtistNames(row["Artist Name(s)"])
      const rawArtistNames = splitNames(row["Artist Name(s)"])
      const year = extractYear(row["Release Date"])

      const albumKey = `${albumTitle}|${formattedArtistNames}`
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, {
          title: albumTitle,
          artistName: formattedArtistNames,
          artists: rawArtistNames,
          year: year,
        })
      }
    })

    console.log(`Found ${albumMap.size} unique albums`)
    const { createdAlbums, failedAlbums } = await handleUniqueAlbums(albumMap)

    console.log(`Successfully created ${createdAlbums.length} albums`)

    console.log("\n=== SUMMARY ===")
    console.log(`Albums created: ${createdAlbums.length}/${albumMap.size}`)
    if (failedAlbums.length > 0) {
      const failedFile = "failed_albums.txt"
      fs.writeFileSync(failedFile, failedAlbums.join("\n"), "utf-8")
      console.log(`\n❌ Failed album names written to ${failedFile}`)
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
populateAlbums().catch(console.error)
