import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { FileAnalysisResponse, FileInProject, DataSchema } from "../types";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Share2,
  MessageSquare,
  TrendingUp,
  Target,
  Users,
  AlertTriangle,
  Save,
  Check,
} from "lucide-react";
import { ExportModal, ExportOptions } from "../components/charts/ExportModal";
import { InsightCard } from "../components/insights/InsightCard";
import { ChartCard } from "../components/ChartCard";
import { AnalysisList } from "../components/AnalysisList";

export default function ProjectFileAnalysis() {
  const { projectId, fileId } = useParams<{
    projectId: string;
    fileId: string;
  }>();
  const navigate = useNavigate();

  const [fileMetadata, setFileMetadata] = useState<FileInProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Re-analyze dialog state
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false);
  const [userIntent, setUserIntent] = useState("");

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Multi-analysis state (NEW: saved analyses from database)
  const [savedAnalyses, setSavedAnalyses] = useState<import("../types").SavedAnalysisSummary[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<import("../types").SavedAnalysisDetail | null>(null);
  const [temporaryAnalyses, setTemporaryAnalyses] = useState<FileAnalysisResponse[]>([]);
  const [currentTempIndex, setCurrentTempIndex] = useState<number | null>(null);

  // View modes: "list" (show all saved), "view" (viewing specific saved), "temp" (temporary)
  const [viewMode, setViewMode] = useState<"list" | "view" | "temp">("list");

  // Currently displayed analysis
  const displayedAnalysis =
    viewMode === "temp" && currentTempIndex !== null
      ? temporaryAnalyses[currentTempIndex]
      : viewMode === "view" && currentAnalysis
      ? {
          file_id: currentAnalysis.file_id,
          filename: currentAnalysis.filename,
          charts: currentAnalysis.charts,
          global_summary: currentAnalysis.global_summary,
          user_intent: currentAnalysis.user_intent,
          analyzed_at: currentAnalysis.created_at,
        }
      : null;

  const isSaved = viewMode === "view";

  useEffect(() => {
    loadFileData();
  }, [projectId, fileId]);

  // Warn user before leaving with unsaved analyses
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (viewMode === "temp" && temporaryAnalyses.length > 0) {
        e.preventDefault();
        e.returnValue = "You have unsaved analyses. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [viewMode, temporaryAnalyses]);

  const loadFileData = async () => {
    if (!projectId || !fileId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch file metadata from project files list
      const files = await api.listProjectFiles(parseInt(projectId));
      const file = files.find((f) => f.id === parseInt(fileId));

      if (!file) {
        throw new Error("File not found");
      }

      setFileMetadata(file);

      // Fetch all saved analyses (NEW)
      try {
        const analysesData = await api.listFileAnalyses(
          parseInt(projectId),
          parseInt(fileId),
        );
        setSavedAnalyses(analysesData.analyses);

        // If no analyses, stay in list mode (empty state)
        if (analysesData.analyses.length === 0) {
          setViewMode("list");
        }
      } catch (err: any) {
        console.error("Failed to load analyses:", err);
        // Stay in list mode with empty state
        setViewMode("list");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load file data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!projectId || !fileId) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Generate temporary analysis (save=false)
      const data = await api.analyzeProjectFile(
        parseInt(projectId),
        parseInt(fileId),
        userIntent || undefined,
        false  // Don't save to database
      );

      // Add to temporary analyses
      setTemporaryAnalyses(prev => [...prev, data]);
      setCurrentTempIndex(temporaryAnalyses.length);  // Show latest
      setViewMode("temp");  // Switch to temp view
      setShowReanalyzeDialog(false);
      setUserIntent("");
    } catch (err: any) {
      setError(err.message || "Failed to analyze file");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!displayedAnalysis || !projectId || !fileId) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Save the current temporary analysis to database (save=true)
      await api.analyzeProjectFile(
        parseInt(projectId),
        parseInt(fileId),
        displayedAnalysis.user_intent || undefined,
        true  // Save to database
      );

      // Reload analyses list and switch to list view
      await loadFileData();
      setTemporaryAnalyses([]);  // Clear temporary analyses
      setCurrentTempIndex(null);
      setViewMode("list");  // Back to list view
    } catch (err: any) {
      setError(err.message || "Failed to save analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  // NEW: Handler for viewing a saved analysis
  const handleViewAnalysis = async (analysisId: number) => {
    if (!projectId || !fileId) return;

    try {
      setLoading(true);
      const analysisData = await api.getFileAnalysis(
        parseInt(projectId),
        parseInt(fileId),
        analysisId,
      );
      setCurrentAnalysis(analysisData);
      setViewMode("view");
    } catch (err: any) {
      setError(err.message || "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handler for deleting a saved analysis
  const handleDeleteAnalysis = async (analysisId: number) => {
    if (!projectId || !fileId) return;

    try {
      await api.deleteFileAnalysis(
        parseInt(projectId),
        parseInt(fileId),
        analysisId,
      );

      // Reload analyses list
      await loadFileData();
    } catch (err: any) {
      setError(err.message || "Failed to delete analysis");
    }
  };

  // NEW: Handler to go back to list view
  const handleBackToList = () => {
    setViewMode("list");
    setCurrentAnalysis(null);
    setTemporaryAnalyses([]);
    setCurrentTempIndex(null);
  };

  const handleExport = async (options: ExportOptions) => {
    if (!displayedAnalysis) return;

    try {
      setError(null);

      // Call advanced export API
      const response = await api.exportAdvanced({
        file_id: displayedAnalysis.file_id,
        export_format: options.format as "pdf" | "png" | "excel",
        include_charts: options.includeCharts,
        include_insights: options.includeInsights,
        include_raw_data: options.includeRawData,
        include_summary: true,
      });

      // Download the file
      window.open(response.download_url, "_blank");

      setExportModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Export failed");
      throw err;
    }
  };

  // Utility function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Utility function to calculate file statistics from metadata
  const calculateFileStats = () => {
    if (!fileMetadata) {
      return {
        fileSize: "N/A",
        rows: 0,
        columns: 0,
        dataQuality: 100,
        missingValues: 0,
        lastModified: "N/A",
      };
    }

    let schema: DataSchema | null = null;
    try {
      schema = fileMetadata.data_schema_json
        ? JSON.parse(fileMetadata.data_schema_json)
        : null;
    } catch (e) {
      console.error("Failed to parse data_schema_json:", e);
    }

    const columnCount = schema?.columns?.length || 0;
    const rowCount = fileMetadata.row_count || schema?.row_count || 0;
    const totalCells = rowCount * columnCount;

    // Calculate missing values from schema
    const missingValues =
      schema?.columns?.reduce((sum, col) => sum + (col.null_count || 0), 0) ||
      0;

    // Calculate data quality percentage
    const dataQuality =
      totalCells > 0 ? ((totalCells - missingValues) / totalCells) * 100 : 100;

    // Format last modified date
    const lastModified = fileMetadata.analyzed_at || fileMetadata.uploaded_at;
    const lastModifiedDate = new Date(lastModified);
    const now = new Date();
    const diffMs = now.getTime() - lastModifiedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let lastModifiedStr = "";
    if (diffMins < 1) lastModifiedStr = "Just now";
    else if (diffMins < 60) lastModifiedStr = `${diffMins}m ago`;
    else if (diffHours < 24) lastModifiedStr = `${diffHours}h ago`;
    else if (diffDays < 7) lastModifiedStr = `${diffDays}d ago`;
    else lastModifiedStr = lastModifiedDate.toLocaleDateString();

    return {
      fileSize: formatFileSize(fileMetadata.file_size),
      rows: rowCount,
      columns: columnCount,
      dataQuality: dataQuality,
      missingValues: missingValues,
      lastModified: lastModifiedStr,
    };
  };

  // Extract insights from global_summary or chart insights
  const extractInsights = () => {
    const insights = [];

    if (displayedAnalysis?.global_summary) {
      // Split summary into sentences and take first 4
      const sentences = displayedAnalysis.global_summary
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);

      if (sentences.length > 0) {
        insights.push({
          title: "Revenue Trend",
          description: sentences[0]?.trim() || "Analysis in progress...",
          color: "blue" as const,
          icon: TrendingUp,
        });
      }

      if (sentences.length > 1) {
        insights.push({
          title: "Key Finding",
          description: sentences[1]?.trim() || "Analysis in progress...",
          color: "green" as const,
          icon: Target,
        });
      }

      if (sentences.length > 2) {
        insights.push({
          title: "Data Insight",
          description: sentences[2]?.trim() || "Analysis in progress...",
          color: "purple" as const,
          icon: Users,
        });
      }

      if (sentences.length > 3) {
        insights.push({
          title: "Additional Note",
          description: sentences[3]?.trim() || "Analysis in progress...",
          color: "orange" as const,
          icon: AlertTriangle,
        });
      }
    }

    // Fill remaining slots with chart insights if available
    while (insights.length < 4 && displayedAnalysis?.charts) {
      const chartIdx: number = insights.length;
      if (displayedAnalysis.charts[chartIdx]?.insight) {
        insights.push({
          title: displayedAnalysis.charts[chartIdx].title,
          description: displayedAnalysis.charts[chartIdx].insight,
          color: (["blue", "green", "purple", "orange"] as const)[chartIdx % 4],
          icon: [TrendingUp, Target, Users, AlertTriangle][chartIdx % 4],
        });
      } else {
        break;
      }
    }

    return insights;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !showReanalyzeDialog) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </Layout>
    );
  }

  const insights = extractInsights();

  return (
    <Layout>
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(`/projects/${projectId}`)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {displayedAnalysis?.filename || "File Analysis"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  File analysis and insights •{" "}
                  {displayedAnalysis?.user_intent || "Automated Analysis"}
                </p>
              </div>

              {/* Status badge */}
              {!isSaved && displayedAnalysis && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Temporary (Not Saved)
                </Badge>
              )}

              {isSaved && currentAnalysis && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <Check className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Save button (only for temporary analyses) */}
            {!isSaved && displayedAnalysis && (
              <Button
                onClick={handleSaveAnalysis}
                disabled={analyzing}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save This Analysis
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setExportModalOpen(true)}
              className="border-gray-300 text-gray-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-700">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              onClick={() => setShowReanalyzeDialog(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {displayedAnalysis ? "New Analysis" : "Ask AI"}
            </Button>
          </div>
        </div>
      </header>

      {/* File Info Bar - 6 columns */}
      {loading ? (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="grid grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="grid grid-cols-6 gap-6">
            <div>
              <p className="text-gray-500 text-sm mb-1">File Size</p>
              <p className="text-lg font-semibold text-gray-900">
                {calculateFileStats().fileSize}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Rows</p>
              <p className="text-lg font-semibold text-gray-900">
                {calculateFileStats().rows.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Columns</p>
              <p className="text-lg font-semibold text-gray-900">
                {calculateFileStats().columns}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Data Quality</p>
              <p className="text-lg font-semibold text-green-600">
                {calculateFileStats().dataQuality.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Missing Values</p>
              <p className="text-lg font-semibold text-orange-600">
                {calculateFileStats().missingValues.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Last Modified</p>
              <p className="text-lg font-semibold text-gray-900">
                {calculateFileStats().lastModified}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Switcher (when multiple temporary analyses exist) */}
      {temporaryAnalyses.length > 1 && !isSaved && (
        <div className="bg-blue-50 border-b border-blue-200 px-8 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              Temporary Analyses ({temporaryAnalyses.length})
            </span>
            <div className="flex space-x-2 overflow-x-auto">
              {temporaryAnalyses.map((temp, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={currentTempIndex === index ? "default" : "outline"}
                  onClick={() => setCurrentTempIndex(index)}
                  className="whitespace-nowrap"
                >
                  {temp.user_intent?.slice(0, 40) || `Analysis ${index + 1}`}
                  {temp.user_intent && temp.user_intent.length > 40 && '...'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="px-8 py-6 space-y-6 overflow-auto">
        {/* LIST VIEW: Show all saved analyses */}
        {viewMode === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Saved Analyses</h2>
              <Button
                onClick={() => setShowReanalyzeDialog(true)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Create New Analysis
              </Button>
            </div>
            <AnalysisList
              analyses={savedAnalyses}
              onViewAnalysis={handleViewAnalysis}
              onDeleteAnalysis={handleDeleteAnalysis}
              loading={loading}
            />
          </div>
        )}

        {/* ANALYSIS VIEW: Show either saved or temporary analysis */}
        {(viewMode === "view" || viewMode === "temp") && (
          <>
            {/* Back button */}
            <div className="mb-4">
              <Button
                onClick={handleBackToList}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analyses List
              </Button>
            </div>

            {/* AI-Generated Insights Section - 2x2 Grid */}
            {insights.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  AI-Generated Insights
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {insights.map((insight, index) => (
                    <InsightCard
                      key={index}
                      title={insight.title}
                      description={insight.description}
                      color={insight.color}
                      icon={insight.icon}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Charts Section - 2x2 Grid */}
            {displayedAnalysis?.charts && displayedAnalysis.charts.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {displayedAnalysis.charts.map((chart: any, index: number) => (
                  <ChartCard
                    key={index}
                    chart={chart}
                    fileId={fileId ? parseInt(fileId) : undefined}
                  />
                ))}
              </div>
            )}

            {/* No Charts Placeholder */}
            {(!displayedAnalysis?.charts || displayedAnalysis.charts.length === 0) && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">No Charts Generated</p>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    No charts were generated for this file. Try analyzing with a
                    specific question or intent.
                  </p>
                  <Button onClick={() => setShowReanalyzeDialog(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Analyze File
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Re-analyze Dialog */}
      <Dialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {displayedAnalysis ? "Re-analyze File" : "Analyze File"}
            </DialogTitle>
            <DialogDescription>
              {displayedAnalysis
                ? "Generate fresh analysis with a new intent or question."
                : "Generate charts and insights for this file."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="intent">Your Intent (Optional)</Label>
              <Textarea
                id="intent"
                placeholder="e.g., Analyze pharmacist distribution with average ratings: show top pharmacy groups, best-rated pharmacies within each group, breakdown by geographic type, and comparison between urban vs rural pharmacies"
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                Describe what you want to understand about this data. You can provide detailed requirements.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReanalyzeDialog(false)}
              disabled={analyzing}
            >
              Cancel
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? "Analyzing..." : displayedAnalysis ? "Re-analyze" : "Analyze"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        fileId={fileId ? parseInt(fileId) : undefined}
        projectId={projectId ? parseInt(projectId) : undefined}
        defaultFilename={
          displayedAnalysis?.filename.replace(/\.[^/.]+$/, "") || "analysis"
        }
      />
    </Layout>
  );
}
