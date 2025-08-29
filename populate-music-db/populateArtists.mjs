import { API_BASE_URL, readCSV, createArtist, delay } from "./utils.mjs"
import fs from "fs"

async function populateArtists() {
  try {
    console.log("Reading CSV file...")
    const newData = await readCSV("<replace-with-desired-file>")
    const existingArtists = await readCSV("<replace-with-desired-file>")
    console.log(`Found ${newData.length} records in CSV`)
    console.log(`Found ${existingArtists.length} existing artists`)

    // Step 1: Extract and deduplicate artists
    console.log("\n=== Processing Artists ===")
    const uniqueArtists = [
      ...new Set(
        newData.flatMap((row) =>
          row["Artist Name(s)"].split(",").map((name) => name.trim())
        ),
        existingArtists.map((row) => row["displayName"])
      ),
    ]
    console.log(`Found ${uniqueArtists.length} unique artists`)

    const createdArtists = []
    const failedArtists = []
    for (const artistName of uniqueArtists) {
      console.log(`Processing artist: ${artistName}`)
      try {
        await createArtist(artistName)
        createdArtists.push(artistName)
        await delay(500) // Rate limiting
      } catch (error) {
        console.error(`Skipping artist ${artistName} due to error`, error)
        failedArtists.push(artistName)
      }
    }
    console.log(`Successfully created ${createdArtists.length} artists`)

    console.log("\n=== SUMMARY ===")
    console.log(
      `Artists created: ${createdArtists.length}/${uniqueArtists.length}`
    )
    if (failedArtists.length > 0) {
      const failedFile = "failed_artists.txt"
      fs.writeFileSync(failedFile, failedArtists.join("\n"), "utf-8")
      console.log(`\n❌ Failed artist names written to ${failedFile}`)
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
populateArtists().catch(console.error)
