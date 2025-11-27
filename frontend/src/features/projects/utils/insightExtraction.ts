/**
 * Utilities for extracting insights from analysis data
 */

import { TrendingUp, Target, Users, AlertTriangle, MessageSquare, type LucideIcon } from 'lucide-react';
import type { FileAnalysisResponse, ChartData } from '@/types';

export interface Insight {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Extract insights from analysis data (global summary or chart insights)
 */
export function extractInsights(analysis: FileAnalysisResponse | null): Insight[] {
  const insights: Insight[] = [];

  if (!analysis) return insights;

  if (analysis.global_summary) {
    // Split summary into sentences and take first 4
    const sentences = analysis.global_summary
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);

    sentences.forEach((sentence, index) => {
      let icon: LucideIcon = TrendingUp;
      let title = 'Key Finding';

      // Simple keyword matching for icons and titles
      if (sentence.toLowerCase().includes('trend')) {
        icon = TrendingUp;
        title = 'Trend';
      } else if (sentence.toLowerCase().includes('high') || sentence.toLowerCase().includes('increase')) {
        icon = Target;
        title = 'Performance';
      } else if (sentence.toLowerCase().includes('customer') || sentence.toLowerCase().includes('user')) {
        icon = Users;
        title = 'User Insight';
      } else if (sentence.toLowerCase().includes('risk') || sentence.toLowerCase().includes('concern')) {
        icon = AlertTriangle;
        title = 'Risk';
      }

      insights.push({
        icon,
        title: `${title} ${index + 1}`,
        description: sentence,
      });
    });
  }

  // If we don't have enough insights from global summary, extract from chart insights
  if (insights.length < 3 && analysis.charts) {
    analysis.charts
      .filter((chart: ChartData) => chart.insight)
      .slice(0, 3 - insights.length)
      .forEach((chart: ChartData, index: number) => {
        insights.push({
          icon: MessageSquare,
          title: `Chart Insight ${insights.length + index + 1}`,
          description: chart.insight!,
        });
      });
  }

  return insights;
}
