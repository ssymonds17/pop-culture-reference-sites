import fs from "node:fs"
import {
  API_BASE_URL,
  readCSV,
  delay,
  updateAlbumTotalSongs,
} from "./utils.mjs"

async function updateAllAlbumTotalSongs() {
  try {
    console.log("Reading albums_list.csv file...")
    const albums = await readCSV("albums_list.csv")
    console.log(`Found ${albums.length} albums in CSV`)

    const successfulUpdates = []
    const failedUpdates = []
    const skippedAlbums = []

    console.log("\n=== Updating Album Total Songs ===")

    for (let i = 0; i < albums.length; i++) {
      const album = albums[i]
      const albumId = album._id
      const totalSongs = album.totalSongs

      // Skip if no ID or no totalSongs value
      if (!albumId) {
        console.log(`Skipping album at row ${i + 2}: Missing _id`)
        skippedAlbums.push({ row: i + 2, reason: "Missing _id" })
        continue
      }

      if (!totalSongs || totalSongs === "") {
        console.log(
          `Skipping album ${albumId} at row ${i + 2}: Missing totalSongs`,
        )
        skippedAlbums.push({
          row: i + 2,
          albumId,
          reason: "Missing totalSongs",
        })
        continue
      }

      try {
        const totalSongsNumber = Number.parseInt(totalSongs)
        if (Number.isNaN(totalSongsNumber)) {
          console.log(
            `Skipping album ${albumId} at row ${i + 2}: Invalid totalSongs value "${totalSongs}"`,
          )
          skippedAlbums.push({
            row: i + 2,
            albumId,
            reason: `Invalid totalSongs value: ${totalSongs}`,
          })
          continue
        }

        await updateAlbumTotalSongs(albumId, totalSongsNumber)
        successfulUpdates.push(albumId)

        // Rate limiting to avoid overwhelming the API
        await delay(500)
      } catch (error) {
        console.error(`Failed to update album ${albumId}:`, error.message)
        failedUpdates.push({ albumId, error: error.message })
      }
    }

    console.log("\n=== SUMMARY ===")
    console.log(`Total albums in CSV: ${albums.length}`)
    console.log(`Successfully updated: ${successfulUpdates.length}`)
    console.log(`Failed: ${failedUpdates.length}`)
    console.log(`Skipped: ${skippedAlbums.length}`)

    // Write failed updates to file if any
    if (failedUpdates.length > 0) {
      const failedFile = "failed_album_updates.txt"
      const failedContent = failedUpdates
        .map((f) => `${f.albumId}: ${f.error}`)
        .join("\n")
      fs.writeFileSync(failedFile, failedContent, "utf-8")
      console.log(`\n❌ Failed updates written to ${failedFile}`)
    }

    // Write skipped albums to file if any
    if (skippedAlbums.length > 0) {
      const skippedFile = "skipped_albums.txt"
      const skippedContent = skippedAlbums
        .map((s) => `Row ${s.row}: ${s.albumId || "No ID"} - ${s.reason}`)
        .join("\n")
      fs.writeFileSync(skippedFile, skippedContent, "utf-8")
      console.log(`\n⚠️  Skipped albums written to ${skippedFile}`)
    }

    console.log("\n✅ Album total songs update completed!")
  } catch (error) {
    console.error("Error processing CSV:", error)
  }
}

// Check if API base URL is configured
if (API_BASE_URL === "https://your-api-gateway-url.amazonaws.com") {
  console.error(
    "⚠️  Please update the API_BASE_URL in utils.mjs with your actual API Gateway URL",
  )
  process.exit(1)
}

// Run the script
updateAllAlbumTotalSongs().catch(console.error)
