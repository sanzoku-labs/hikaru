import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type {
  ProjectResponse,
  FileInProject,
  ComparisonResponse,
  MergeAnalyzeResponse,
} from "@/types";
import { Layout } from "@/components/Layout";
import { FileExplorer } from "@/components/projects/FileExplorer";
import { FileInfoCard } from "@/components/projects/FileInfoCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Upload,
  FileText,
  Calendar,
  X,
  GitCompare,
  GitMerge,
  BarChart3,
  Table,
  MessageSquare,
} from "lucide-react";
import { ChartGrid } from "@/components/ChartGrid";
import { GlobalSummary } from "@/components/GlobalSummary";
import { DataPreview } from "@/components/DataPreview";
import { FileUploadZone } from "@/components/projects/FileUploadZone";
import { ComparisonWizard } from "@/components/comparison/ComparisonWizard";
import { MergeWizard } from "@/components/merging/MergeWizard";

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [files, setFiles] = useState<FileInProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File selection and workspace state
  const [selectedFileId, setSelectedFileId] = useState<number | undefined>();
  const [workspaceTab, setWorkspaceTab] = useState<
    "preview" | "analytics" | "compare" | "merge" | "chat"
  >("preview");

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [comparisonWizardOpen, setComparisonWizardOpen] = useState(false);
  const [mergeWizardOpen, setMergeWizardOpen] = useState(false);

  const [comparisonData, setComparisonData] =
    useState<ComparisonResponse | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeAnalyzeResponse | null>(
    null,
  );
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectRes, filesRes] = await Promise.all([
        api.getProject(Number(projectId)),
        api.listProjectFiles(Number(projectId)),
      ]);
      setProject(projectRes);
      setFiles(filesRes);

      // Auto-select first file if none selected
      if (filesRes.length > 0 && !selectedFileId) {
        setSelectedFileId(filesRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (fileId: number) => {
    setSelectedFileId(fileId);
    setWorkspaceTab("preview");

    // Load analysis if available
    const file = files.find((f) => f.id === fileId);
    if (file?.has_analysis) {
      try {
        const analysis = await api.getProjectFileAnalysis(
          Number(projectId),
          fileId,
        );
        setFileAnalysis(analysis);
      } catch (err) {
        console.error("Failed to load analysis:", err);
      }
    } else {
      setFileAnalysis(null);
    }
  };

  // Get selected file data
  const selectedFile = files.find((f) => f.id === selectedFileId);

  // Convert files for FileExplorer
  const explorerFiles = files.map((file) => ({
    id: file.id,
    filename: file.filename,
    fileSize: `${(file.file_size / 1024).toFixed(1)} KB`,
    fileType: (file.filename.split(".").pop()?.toLowerCase() as any) || "other",
    hasAnalysis: file.has_analysis,
    uploadedAt: file.uploaded_at,
  }));

  const handleFileUpload = async (filesToUpload: File[]) => {
    if (!projectId || filesToUpload.length === 0) return;

    try {
      // Upload first file (single file upload for now)
      await api.uploadFileToProject(Number(projectId), filesToUpload[0]);
      await loadProjectData();
      setUploadDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "File upload failed");
      throw err;
    }
  };

  const handleAnalyzeFile = (fileId: number) => {
    navigate(`/projects/${projectId}/files/${fileId}/analysis`);
  };

  const handleCompareFiles = async (
    fileAId: number,
    fileBId: number,
    comparisonType: string,
  ) => {
    if (!projectId) return;

    try {
      setError(null);
      const result = await api.compareFiles(Number(projectId), {
        file_a_id: fileAId,
        file_b_id: fileBId,
        comparison_type: comparisonType as any,
      });
      setComparisonData(result);
      setComparisonWizardOpen(false);
    } catch (err: any) {
      setError(err.message || "Comparison failed");
      throw err;
    }
  };

  const handleMergeFiles = async (
    fileAId: number,
    fileBId: number,
    joinKey: string,
    mergeType: string,
  ) => {
    if (!projectId) return;

    try {
      setError(null);
      const relationship = await api.createRelationship(Number(projectId), {
        file_a_id: fileAId,
        file_b_id: fileBId,
        join_type: mergeType as any,
        left_key: joinKey,
        right_key: joinKey,
        left_suffix: "_a",
        right_suffix: "_b",
      });

      // Analyze merged data
      const mergeAnalysis = await api.analyzeMergedData(Number(projectId), {
        relationship_id: relationship.id,
      });
      setMergeResult(mergeAnalysis);
      setMergeWizardOpen(false);
      await loadProjectData();
    } catch (err: any) {
      setError(err.message || "Merge failed");
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Convert files to format expected by wizards
  const wizardFiles = files.map((file) => ({
    id: file.id,
    filename: file.filename,
    file_size: file.file_size,
    row_count: file.row_count || 0,
    columns: [], // TODO: Add columns from schema_json
    uploaded_at: file.uploaded_at,
  }));

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>Project not found</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Workspace Layout: FileExplorer Sidebar + Main Area */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - File Explorer */}
        <FileExplorer
          files={explorerFiles}
          selectedFileId={selectedFileId}
          onFileSelect={handleFileSelect}
          onUploadFile={() => setUploadDialogOpen(true)}
          className="w-64 flex-shrink-0"
        />

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6 space-y-6">
            {/* Project Header */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/projects")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                  {project.description && (
                    <p className="text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {files.length} files
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {formatDate(project.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setComparisonWizardOpen(true)}
                    disabled={files.length < 2}
                  >
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMergeWizardOpen(true)}
                    disabled={files.length < 2}
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* File Info Card (when file selected) */}
            {selectedFile &&
              (() => {
                // Parse data schema to compute column count and data quality
                let totalColumns: number | undefined;
                let dataQuality: number | undefined;

                if (selectedFile.data_schema_json) {
                  try {
                    const schema = JSON.parse(selectedFile.data_schema_json);
                    totalColumns = schema.columns?.length;

                    // Calculate data quality as percentage of non-null values
                    if (schema.columns && schema.row_count) {
                      const totalCells =
                        schema.columns.length * schema.row_count;
                      const nullCells = schema.columns.reduce(
                        (sum: number, col: any) => sum + (col.null_count || 0),
                        0,
                      );
                      dataQuality = Math.round(
                        ((totalCells - nullCells) / totalCells) * 100,
                      );
                    }
                  } catch (e) {
                    // Ignore parse errors, leave values as undefined
                  }
                }

                return (
                  <FileInfoCard
                    filename={selectedFile.filename}
                    fileSize={`${(selectedFile.file_size / 1024).toFixed(1)} KB`}
                    totalRows={selectedFile.row_count}
                    totalColumns={totalColumns}
                    dataQuality={dataQuality}
                    fileType={
                      selectedFile.filename.split(".").pop()?.toUpperCase() ||
                      "UNKNOWN"
                    }
                    onDownload={() => {
                      // TODO: Implement file download
                      // File download implementation pending
                    }}
                    onAnalyze={() => handleAnalyzeFile(selectedFile.id)}
                  />
                );
              })()}

            {/* Workspace Tabs (Horizontal) */}
            {selectedFile ? (
              <Tabs
                value={workspaceTab}
                onValueChange={(value) => setWorkspaceTab(value as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="preview">
                    <Table className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="analytics" disabled={!fileAnalysis}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="compare" disabled={files.length < 2}>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare
                  </TabsTrigger>
                  <TabsTrigger value="merge" disabled={files.length < 2}>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge
                  </TabsTrigger>
                  <TabsTrigger value="chat">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-4 mt-6">
                  {fileAnalysis && fileAnalysis.data_schema ? (
                    <DataPreview
                      schema={fileAnalysis.data_schema}
                      filename={selectedFile.filename}
                    />
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">
                          No analysis available
                        </p>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                          Analyze this file to see data preview and insights
                        </p>
                        <Button
                          onClick={() => handleAnalyzeFile(selectedFile.id)}
                          size="lg"
                        >
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Analyze File
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4 mt-6">
                  {fileAnalysis ? (
                    <div className="space-y-6">
                      {fileAnalysis.global_summary && (
                        <GlobalSummary summary={fileAnalysis.global_summary} />
                      )}
                      <ChartGrid
                        charts={fileAnalysis.charts || []}
                        loading={false}
                      />
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">
                          No analytics available
                        </p>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                          Generate charts and AI insights for this file
                        </p>
                        <Button
                          onClick={() => handleAnalyzeFile(selectedFile.id)}
                          size="lg"
                        >
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Analyze File
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Compare Tab */}
                <TabsContent value="compare" className="space-y-6 mt-6">
                  {comparisonData ? (
                    <div className="space-y-6">
                      <GlobalSummary summary={comparisonData.summary_insight} />
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Overlay Charts
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {comparisonData.overlay_charts.map((chart, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <CardTitle className="text-base">
                                  {chart.title}
                                </CardTitle>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {chart.file_a_name}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {chart.file_b_name}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {chart.comparison_insight && (
                                  <p className="text-sm text-muted-foreground">
                                    {chart.comparison_insight}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <GitCompare className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">
                          No comparison results yet
                        </p>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                          Start a comparison to see overlay charts and insights
                        </p>
                        <Button
                          onClick={() => setComparisonWizardOpen(true)}
                          size="lg"
                        >
                          <GitCompare className="h-5 w-5 mr-2" />
                          Start Comparison
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Merge Tab */}
                <TabsContent value="merge" className="space-y-6 mt-6">
                  {mergeResult ? (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Merged Data Summary</CardTitle>
                          <CardDescription>
                            {mergeResult.merged_row_count.toLocaleString()} rows
                            in merged dataset
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {mergeResult.global_summary && (
                        <GlobalSummary summary={mergeResult.global_summary} />
                      )}

                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Analysis of Merged Data
                        </h3>
                        <ChartGrid
                          charts={mergeResult.charts}
                          loading={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <GitMerge className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">
                          No merge results yet
                        </p>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                          Merge files to create enriched datasets for analysis
                        </p>
                        <Button
                          onClick={() => setMergeWizardOpen(true)}
                          size="lg"
                        >
                          <GitMerge className="h-5 w-5 mr-2" />
                          Start Merge
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Chat Tab (Placeholder) */}
                <TabsContent value="chat" className="space-y-4 mt-6">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">
                        Chat feature coming soon
                      </p>
                      <p className="text-muted-foreground text-center max-w-md">
                        Ask questions about your data and get AI-powered
                        insights
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-24">
                  <FileText className="h-20 w-20 text-muted-foreground mb-4" />
                  <p className="text-xl font-medium mb-2">
                    {files.length === 0
                      ? "No files uploaded yet"
                      : "Select a file to get started"}
                  </p>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {files.length === 0
                      ? "Upload CSV or Excel files to start analyzing your data"
                      : "Choose a file from the sidebar to view preview, analytics, and more"}
                  </p>
                  {files.length === 0 && (
                    <Button onClick={() => setUploadDialogOpen(true)} size="lg">
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Your First File
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload File to Project</DialogTitle>
          </DialogHeader>
          <FileUploadZone
            onUpload={handleFileUpload}
            acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
            maxSize={10}
          />
        </DialogContent>
      </Dialog>

      {/* Comparison Wizard Dialog */}
      <Dialog
        open={comparisonWizardOpen}
        onOpenChange={setComparisonWizardOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Files</DialogTitle>
          </DialogHeader>
          <ComparisonWizard
            files={wizardFiles}
            onComplete={handleCompareFiles}
            onCancel={() => setComparisonWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Merge Wizard Dialog */}
      <Dialog open={mergeWizardOpen} onOpenChange={setMergeWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Merge Files</DialogTitle>
          </DialogHeader>
          <MergeWizard
            files={wizardFiles}
            onComplete={handleMergeFiles}
            onCancel={() => setMergeWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
