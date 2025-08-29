import {
  API_BASE_URL,
  readCSV,
  delay,
  extractYear,
  searchArtist,
  createAlbum,
} from "./utils.mjs"

async function populateAlbums() {
  try {
    console.log("Reading CSV file...")
    const newData = await readCSV("<replace-with-desired-file>")
    console.log(`Found ${newData.length} records in CSV`)

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
    const failedAlbums = []
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
        console.error(`Skipping album ${albumInfo.title} due to error`, error)
        failedAlbums.push(albumInfo.title)
      }
    }
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
