/**
 * Project Stats Component
 * Displays project statistics in stat cards
 */

import { StatCard } from '@/components/shared/StatCard';
import { FolderOpen, CheckCircle2, FileSpreadsheet, BarChart3 } from 'lucide-react';
import type { ProjectStats as ProjectStatsType } from '../../utils/projectFilters';

interface ProjectStatsProps {
  stats: ProjectStatsType;
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Total Projects"
        value={stats.totalProjects}
        icon={FolderOpen}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />
      <StatCard
        label="Active Projects"
        value={stats.activeProjects}
        icon={CheckCircle2}
        iconColor="text-emerald-600"
        iconBgColor="bg-emerald-100"
      />
      <StatCard
        label="Files Analyzed"
        value={stats.filesAnalyzed}
        icon={FileSpreadsheet}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
      />
      <StatCard
        label="Reports Generated"
        value={stats.reportsGenerated}
        icon={BarChart3}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
      />
    </div>
  );
}
