import axios from "axios"
import { API_BASE_URL } from "./utils.mjs"

// Year range based on typical music collection
const START_YEAR = 1950
const END_YEAR = new Date().getFullYear() + 1

const updateYearStats = async (year) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/year/${year}/stats`)

    if (response.data && response.data.totalScore !== undefined) {
      console.log(
        `✓ Updated ${year}: Songs = ${response.data.songs}, ` +
          `Gold = ${response.data.goldAlbums}, Silver = ${response.data.silverAlbums}, ` +
          `Score = ${response.data.totalScore}`,
      )
    } else {
      console.log(`✓ Updated ${year}`)
    }
  } catch (error) {
    console.error(
      `✗ Failed to update ${year}:`,
      error.response?.data?.message || error.message,
    )
    throw error
  }
}

const updateAllYearStats = async () => {
  console.log(`Updating year statistics from ${START_YEAR} to ${END_YEAR}...\n`)

  let successCount = 0
  let failureCount = 0

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    try {
      await updateYearStats(year)
      successCount++
    } catch (error) {
      failureCount++
      // Continue with next year even if one fails
    }
  }

  console.log("\n" + "=".repeat(70))
  console.log(`Year stats update complete!`)
  console.log(`Success: ${successCount} | Failed: ${failureCount}`)
  console.log("=".repeat(70))
}

updateAllYearStats().catch((error) => {
  console.error("Error updating year stats:", error)
  process.exit(1)
})
