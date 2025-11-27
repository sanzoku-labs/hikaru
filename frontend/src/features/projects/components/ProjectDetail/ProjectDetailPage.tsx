/**
 * Project Detail Page - Refactored
 * Main page for project workspace with file explorer and tabs
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type {
  ProjectResponse,
  FileInProject,
  ComparisonResponse,
  MergeAnalyzeResponse,
} from '@/types';
import { Layout } from '@/components/Layout';
import { FileExplorer } from '@/components/projects/FileExplorer';
import { FileInfoCard } from '@/components/projects/FileInfoCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Upload, X } from 'lucide-react';
import { FileUploadZone } from '@/components/projects/FileUploadZone';
import { ComparisonWizard } from '@/components/comparison/ComparisonWizard';
import { MergeWizard } from '@/components/merging/MergeWizard';
import { ProjectHeader } from './ProjectHeader';
import { WorkspaceTabs } from './WorkspaceTabs';
import { PreviewWorkspace } from './PreviewWorkspace';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';
import { ComparisonWorkspace } from './ComparisonWorkspace';
import { MergeWorkspace } from './MergeWorkspace';
import { ChatWorkspace } from './ChatWorkspace';
import { parseDataSchema } from '../../utils/schemaParser';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [files, setFiles] = useState<FileInProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File selection and workspace state
  const [selectedFileId, setSelectedFileId] = useState<number | undefined>();
  const [workspaceTab, setWorkspaceTab] = useState<
    'preview' | 'analytics' | 'compare' | 'merge' | 'chat'
  >('preview');

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [comparisonWizardOpen, setComparisonWizardOpen] = useState(false);
  const [mergeWizardOpen, setMergeWizardOpen] = useState(false);

  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeAnalyzeResponse | null>(null);
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
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (fileId: number) => {
    setSelectedFileId(fileId);
    setWorkspaceTab('preview');

    // Load analysis if available
    const file = files.find((f) => f.id === fileId);
    if (file?.has_analysis) {
      try {
        const analysis = await api.getProjectFileAnalysis(Number(projectId), fileId);
        setFileAnalysis(analysis);
      } catch (err) {
        console.error('Failed to load analysis:', err);
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
    fileType: (file.filename.split('.').pop()?.toLowerCase() as any) || 'other',
    hasAnalysis: file.has_analysis,
    uploadedAt: file.uploaded_at,
  }));

  const handleFileUpload = async (filesToUpload: File[]) => {
    if (!projectId || filesToUpload.length === 0) return;

    try {
      await api.uploadFileToProject(Number(projectId), filesToUpload[0]);
      await loadProjectData();
      setUploadDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
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
      setError(err.message || 'Comparison failed');
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
        left_suffix: '_a',
        right_suffix: '_b',
      });

      const mergeAnalysis = await api.analyzeMergedData(Number(projectId), {
        relationship_id: relationship.id,
      });
      setMergeResult(mergeAnalysis);
      setMergeWizardOpen(false);
      await loadProjectData();
    } catch (err: any) {
      setError(err.message || 'Merge failed');
      throw err;
    }
  };

  // Convert files to format expected by wizards
  const wizardFiles = files.map((file) => ({
    id: file.id,
    filename: file.filename,
    file_size: file.file_size,
    row_count: file.row_count || 0,
    columns: [],
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
  };

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
            <ProjectHeader
              project={project}
              fileCount={files.length}
              onBack={() => navigate('/projects')}
              onCompare={() => setComparisonWizardOpen(true)}
              onMerge={() => setMergeWizardOpen(true)}
            />

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  {error}
                  <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* File Info Card */}
            {selectedFile && (() => {
              const schemaStats = parseDataSchema(selectedFile.data_schema_json);
              return (
                <FileInfoCard
                  filename={selectedFile.filename}
                  fileSize={`${(selectedFile.file_size / 1024).toFixed(1)} KB`}
                  totalRows={selectedFile.row_count}
                  totalColumns={schemaStats.totalColumns}
                  dataQuality={schemaStats.dataQuality}
                  fileType={selectedFile.filename.split('.').pop()?.toUpperCase() || 'UNKNOWN'}
                  onDownload={async () => {
                    try {
                      await api.downloadProjectFile(project.id, selectedFile.id);
                    } catch (err: any) {
                      setError(err.message || 'Failed to download file');
                    }
                  }}
                  onAnalyze={() => handleAnalyzeFile(selectedFile.id)}
                />
              );
            })()}

            {/* Workspace Tabs */}
            {selectedFile ? (
              <WorkspaceTabs
                activeTab={workspaceTab}
                onTabChange={setWorkspaceTab}
                hasAnalysis={!!fileAnalysis}
                canCompare={files.length >= 2}
                canMerge={files.length >= 2}
                previewContent={
                  <PreviewWorkspace
                    dataSchema={fileAnalysis?.data_schema || null}
                    filename={selectedFile.filename}
                    onAnalyze={() => handleAnalyzeFile(selectedFile.id)}
                  />
                }
                analyticsContent={
                  <AnalyticsWorkspace
                    charts={fileAnalysis?.charts || null}
                    globalSummary={fileAnalysis?.global_summary || null}
                    onAnalyze={() => handleAnalyzeFile(selectedFile.id)}
                  />
                }
                compareContent={
                  <ComparisonWorkspace
                    comparisonData={comparisonData}
                    onStartComparison={() => setComparisonWizardOpen(true)}
                  />
                }
                mergeContent={
                  <MergeWorkspace
                    mergeResult={mergeResult}
                    onStartMerge={() => setMergeWizardOpen(true)}
                  />
                }
                chatContent={<ChatWorkspace />}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-24">
                  <FileText className="h-20 w-20 text-muted-foreground mb-4" />
                  <p className="text-xl font-medium mb-2">
                    {files.length === 0 ? 'No files uploaded yet' : 'Select a file to get started'}
                  </p>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {files.length === 0
                      ? 'Upload CSV or Excel files to start analyzing your data'
                      : 'Choose a file from the sidebar to view preview, analytics, and more'}
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
            acceptedFileTypes={['.csv', '.xlsx', '.xls']}
            maxSize={30}
          />
        </DialogContent>
      </Dialog>

      {/* Comparison Wizard Dialog */}
      <Dialog open={comparisonWizardOpen} onOpenChange={setComparisonWizardOpen}>
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
