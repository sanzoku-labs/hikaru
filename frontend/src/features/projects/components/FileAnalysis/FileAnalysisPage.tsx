/**
 * File Analysis Page - Refactored
 * Main page for viewing file analysis with charts and insights
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { FileAnalysisHeader } from './FileAnalysisHeader';
import { FileStatsBar } from './FileStatsBar';
import { ChartCard } from '@/components/ChartCard';
import { InsightCard } from '@/components/insights/InsightCard';
import { AnalysisList } from '@/components/AnalysisList';
import { ExportModal, ExportOptions } from '@/components/charts/ExportModal';
import { extractInsights } from '../../utils/insightExtraction';
import api from '@/services/api';
import type { FileInProject, FileAnalysisResponse, SavedAnalysisSummary, SavedAnalysisDetail } from '@/types';

export default function FileAnalysisPage() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const navigate = useNavigate();

  // State
  const [fileMetadata, setFileMetadata] = useState<FileInProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Multi-analysis state
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysisSummary[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<SavedAnalysisDetail | null>(null);
  const [temporaryAnalyses, setTemporaryAnalyses] = useState<FileAnalysisResponse[]>([]);
  const [currentTempIndex, setCurrentTempIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'temp'>('list');

  // Computed values
  const displayedAnalysis =
    viewMode === 'temp' && currentTempIndex !== null
      ? temporaryAnalyses[currentTempIndex]
      : viewMode === 'view' && currentAnalysis
      ? {
          file_id: currentAnalysis.file_id,
          filename: currentAnalysis.filename,
          charts: currentAnalysis.charts,
          global_summary: currentAnalysis.global_summary,
          user_intent: currentAnalysis.user_intent,
          analyzed_at: currentAnalysis.created_at,
        }
      : null;

  const isSaved = viewMode === 'view';
  const insights = extractInsights(displayedAnalysis);

  // Load file data
  useEffect(() => {
    loadFileData();
  }, [projectId, fileId]);

  const loadFileData = async () => {
    if (!projectId || !fileId) return;

    try {
      setLoading(true);
      setError(null);

      // Load file metadata
      const files = await api.listProjectFiles(parseInt(projectId));
      const file = files.find((f) => f.id === parseInt(fileId));

      if (!file) {
        setError('File not found');
        return;
      }

      setFileMetadata(file);

      // Load saved analyses
      const analysesData = await api.listFileAnalyses(
        parseInt(projectId),
        parseInt(fileId)
      );
      setSavedAnalyses(analysesData.analyses || []);

      // Load the latest saved analysis if available
      if (analysesData.analyses && analysesData.analyses.length > 0) {
        const latestAnalysis = await api.getFileAnalysis(
          parseInt(projectId),
          parseInt(fileId),
          analysesData.analyses[0].analysis_id
        );
        setCurrentAnalysis(latestAnalysis);
        setViewMode('view');
      } else {
        setViewMode('list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load file data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!projectId || !fileId || !displayedAnalysis) return;

    try {
      await api.analyzeProjectFile(
        parseInt(projectId),
        parseInt(fileId),
        displayedAnalysis.user_intent || undefined,
        undefined,
        true // Save to database
      );

      // Reload analyses list
      await loadFileData();
      setTemporaryAnalyses([]);
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to save analysis');
    }
  };

  const handleViewAnalysis = async (analysisId: number) => {
    if (!projectId || !fileId) return;

    try {
      const analysis = await api.getFileAnalysis(
        parseInt(projectId),
        parseInt(fileId),
        analysisId
      );
      setCurrentAnalysis(analysis);
      setViewMode('view');
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis');
    }
  };

  const handleDeleteAnalysis = async (analysisId: number) => {
    if (!projectId || !fileId) return;

    try {
      await api.deleteFileAnalysis(
        parseInt(projectId),
        parseInt(fileId),
        analysisId
      );
      await loadFileData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete analysis');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentAnalysis(null);
    setCurrentTempIndex(null);
  };

  const handleExport = async (_options: ExportOptions) => {
    // The ExportModal component handles the export internally
    // This is just a placeholder for compatibility
    setExportModalOpen(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  // Show analysis list view
  if (viewMode === 'list') {
    return (
      <Layout>
        <FileAnalysisHeader
          fileMetadata={fileMetadata}
          isSaved={false}
          analyzing={false}
          onBack={() => navigate(`/projects/${projectId}`)}
          onExport={() => setExportModalOpen(true)}
        />

        <FileStatsBar fileMetadata={fileMetadata} />

        <AnalysisList
          analyses={savedAnalyses}
          onViewAnalysis={handleViewAnalysis}
          onDeleteAnalysis={handleDeleteAnalysis}
        />
      </Layout>
    );
  }

  // Show analysis detail view
  return (
    <Layout>
      <FileAnalysisHeader
        fileMetadata={fileMetadata}
        isSaved={isSaved}
        analyzing={false}
        onBack={handleBackToList}
        onSave={!isSaved ? handleSaveAnalysis : undefined}
        onExport={() => setExportModalOpen(true)}
      />

      <FileStatsBar fileMetadata={fileMetadata} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {displayedAnalysis?.charts && displayedAnalysis.charts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Data Visualizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedAnalysis.charts.map((chart, index) => (
              <ChartCard key={index} chart={chart} />
            ))}
          </div>
        </div>
      )}

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
      />
    </Layout>
  );
}
