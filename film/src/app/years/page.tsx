"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { API_ENDPOINTS } from "@/lib/api"
import { YearStats } from "@/types"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import YearFilmsModal from "@/components/Modal/YearFilmsModal"

type MetricKey =
  | "yearScore"
  | "totalFilms"
  | "watchedFilms"
  | "averageRating"
  | "percentRated6Plus"

interface Metric {
  key: MetricKey
  label: string
  color: string
  format: (value: number) => string
}

const METRICS: Metric[] = [
  { key: "yearScore", label: "Year Score", color: "#0ea5e9", format: (v) => v.toFixed(1) },
  { key: "totalFilms", label: "Total Films", color: "#22c55e", format: (v) => String(v) },
  { key: "watchedFilms", label: "Watched Films", color: "#a855f7", format: (v) => String(v) },
  { key: "averageRating", label: "Avg Rating", color: "#f59e0b", format: (v) => v.toFixed(2) },
  { key: "percentRated6Plus", label: "% Above 6", color: "#ec4899", format: (v) => `${v.toFixed(1)}%` },
]

export default function YearsPage() {
  const [years, setYears] = useState<YearStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<YearStats | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("yearScore")

  const activeMetric =
    METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0]

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true)
        const response = await axios.get(API_ENDPOINTS.years)
        setYears(response.data.data)
        setError(null)
      } catch (err) {
        console.error("Error fetching years:", err)
        setError("Failed to load year statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchYears()
  }, [])

  // Chart runs left-to-right by year; the API returns them ordered by score
  const chartData = [...years].sort((a, b) => a.year - b.year)

  // Fire on a click anywhere in a year's column (via the chart's activeLabel) so
  // years with a 0 score — which have no bar to click — can still be opened
  const handleChartClick = (state: { activeLabel?: string | number }) => {
    const year = state?.activeLabel
    if (year == null) return
    const stats = years.find((y) => String(y.year) === String(year))
    if (stats) {
      setSelectedYear(stats)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedYear(null)
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Year Analysis</h1>
        <p className="text-gray-400">
          {activeMetric.label} by year. Click a bar to see that year&apos;s
          stats and films.
        </p>
      </div>

      {loading ? (
        <Skeleton height={420} baseColor="#1f2937" highlightColor="#374151" />
      ) : years.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No year data available.
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Metric:
            </label>
            <div className="flex flex-wrap gap-2">
              {METRICS.map((metric) => (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedMetric === metric.key
                      ? "bg-film-700 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              onClick={handleChartClick}
              className="cursor-pointer"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                vertical={false}
              />
              <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#e5e7eb" }}
                formatter={(value) => [
                  value == null ? "-" : activeMetric.format(Number(value)),
                  activeMetric.label,
                ]}
              />
              <Bar
                dataKey={activeMetric.key}
                fill={activeMetric.color}
                radius={[4, 4, 0, 0]}
                minPointSize={2}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <YearFilmsModal
        yearStats={selectedYear}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
