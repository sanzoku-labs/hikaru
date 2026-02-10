import { useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'

interface ChartColors {
  primary: string
  accent: string
  info: string
  success: string
  purple: string
  background: string
  border: string
  text: string
}

const LIGHT_CHART_COLORS: ChartColors = {
  primary: '#D97706',    // Amber-600
  accent: '#B45309',     // Amber-700
  info: '#0284C7',       // Sky-600
  success: '#16A34A',    // Green-600
  purple: '#7C3AED',     // Violet-600
  background: '#FFFFFF',
  border: '#E5E7EB',
  text: '#6B7280',
}

const DARK_CHART_COLORS: ChartColors = {
  primary: '#F5A623',
  accent: '#E8941C',
  info: '#0EA5E9',
  success: '#22C55E',
  purple: '#8B5CF6',
  background: '#0F1218',
  border: '#1E2330',
  text: '#9CA3AF',
}

export const PIE_COLORS_LIGHT = [
  '#D97706', '#B45309', '#0284C7', '#16A34A',
  '#7C3AED', '#DC2626', '#EA580C', '#0D9488',
]

export const PIE_COLORS_DARK = [
  '#F5A623', '#E8941C', '#0EA5E9', '#22C55E',
  '#8B5CF6', '#EF4444', '#F97316', '#14B8A6',
]

export function useChartColors() {
  const theme = useUIStore((state) => state.theme)

  return useMemo(() => ({
    colors: theme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS,
    pieColors: theme === 'dark' ? PIE_COLORS_DARK : PIE_COLORS_LIGHT,
    theme,
  }), [theme])
}
