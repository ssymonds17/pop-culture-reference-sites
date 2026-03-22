import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const API_URL = process.env.API_URL || "http://localhost:3000"
const START_YEAR = 1915
const END_YEAR = 2026

const updateYearStats = async (year) => {
  try {
    const response = await axios.put(`${API_URL}/year/${year}/stats`)

    if (response.data && response.data.yearScore !== undefined) {
      console.log(
        `✓ Updated ${year}: Year Score = ${response.data.yearScore.toFixed(2)}`,
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

  console.log("\n" + "=".repeat(50))
  console.log(`Year stats update complete!`)
  console.log(`Success: ${successCount} | Failed: ${failureCount}`)
  console.log("=".repeat(50))
}

updateAllYearStats().catch((error) => {
  console.error("Error updating year stats:", error)
  process.exit(1)
})
