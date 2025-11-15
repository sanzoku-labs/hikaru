import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, GitCompare, AlertCircle } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/services/api";
import type { FileInProject, ComparisonResponse } from "@/types";

export function Comparisons() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileInProject[]>([]);
  const [fileAId, setFileAId] = useState<number | null>(null);
  const [fileBId, setFileBId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    if (!projectId) {
      setError("No project selected. Please select a project first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const projectFiles = await api.listProjectFiles(parseInt(projectId));
      setFiles(projectFiles);

      // Auto-select first two files if available
      if (projectFiles.length >= 2) {
        setFileAId(projectFiles[0].id);
        setFileBId(projectFiles[1].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project files");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!projectId || !fileAId || !fileBId) return;

    try {
      setComparing(true);
      setError(null);
      const result = await api.compareFiles(parseInt(projectId), {
        file_a_id: fileAId,
        file_b_id: fileBId,
        comparison_type: "side_by_side",
      });
      setComparison(result);
    } catch (err: any) {
      setError(err.message || "Failed to compare files");
    } finally {
      setComparing(false);
    }
  };

  const getChartOption = (chart: any) => {
    const {
      chart_type,
      title,
      x_column,
      file_a_name,
      file_b_name,
      file_a_data,
      file_b_data,
    } = chart;

    if (chart_type === "line" || chart_type === "bar") {
      return {
        title: { text: title, left: "center" },
        tooltip: { trigger: "axis" },
        legend: { data: [file_a_name, file_b_name], bottom: 10 },
        xAxis: {
          type: "category",
          data: file_a_data.map((d: any) => d[x_column] || d.x),
        },
        yAxis: { type: "value" },
        series: [
          {
            name: file_a_name,
            type: chart_type,
            data: file_a_data.map((d: any) => d.value || d.y),
            itemStyle: { color: "#3b82f6" },
          },
          {
            name: file_b_name,
            type: chart_type,
            data: file_b_data.map((d: any) => d.value || d.y),
            itemStyle: { color: "#10b981" },
          },
        ],
      };
    }

    return {};
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!projectId) {
    return (
      <Layout>
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a project from the Projects page to compare files.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/projects")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Projects
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">File Comparison</h1>
            <p className="text-muted-foreground mt-1">
              Compare two files side-by-side with AI-powered insights
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Files to Compare</CardTitle>
            <CardDescription>
              Choose two files from this project to analyze differences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">File A</label>
                <Select
                  value={fileAId?.toString()}
                  onValueChange={(value) => setFileAId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select first file" />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        {file.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">File B</label>
                <Select
                  value={fileBId?.toString()}
                  onValueChange={(value) => setFileBId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second file" />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        {file.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCompare}
              disabled={
                !fileAId || !fileBId || comparing || fileAId === fileBId
              }
              className="w-full"
            >
              <GitCompare className="mr-2 h-4 w-4" />
              {comparing ? "Comparing..." : "Compare Files"}
            </Button>

            {fileAId === fileBId && fileAId && (
              <p className="text-sm text-orange-600">
                Please select two different files to compare
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6">
            {/* Summary Insight */}
            {comparison.summary_insight && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{comparison.summary_insight}</p>
                </CardContent>
              </Card>
            )}

            {/* Overlay Charts */}
            {comparison.overlay_charts &&
              comparison.overlay_charts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {comparison.overlay_charts.map((chart, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{chart.title}</CardTitle>
                        {chart.comparison_insight && (
                          <CardDescription className="mt-2">
                            {chart.comparison_insight}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <ReactECharts
                          option={getChartOption(chart)}
                          style={{ height: "350px" }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

            {/* No Charts Message */}
            {(!comparison.overlay_charts ||
              comparison.overlay_charts.length === 0) && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    No Charts Generated
                  </p>
                  <p className="text-gray-600 text-center max-w-md">
                    The comparison didn't generate any overlay charts. The files
                    may have incompatible schemas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No Files Message */}
        {files.length < 2 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Not Enough Files</p>
              <p className="text-gray-600 text-center max-w-md mb-6">
                You need at least 2 files in this project to perform a
                comparison.
              </p>
              <Button onClick={() => navigate(`/projects/${projectId}`)}>
                Upload More Files
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
