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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, GitMerge, AlertCircle } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/services/api";
import type {
  FileInProject,
  RelationshipResponse,
  MergeAnalyzeResponse,
} from "@/types";

export function Merging() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileInProject[]>([]);
  const [fileAId, setFileAId] = useState<number | null>(null);
  const [fileBId, setFileBId] = useState<number | null>(null);
  const [joinType, setJoinType] = useState<
    "inner" | "left" | "right" | "outer"
  >("inner");
  const [leftKey, setLeftKey] = useState("");
  const [rightKey, setRightKey] = useState("");

  const [relationship, setRelationship] = useState<RelationshipResponse | null>(
    null,
  );
  const [mergeResult, setMergeResult] = useState<MergeAnalyzeResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available columns from selected files
  const fileAColumns = fileAId
    ? getColumnsFromFile(files.find((f) => f.id === fileAId))
    : [];
  const fileBColumns = fileBId
    ? getColumnsFromFile(files.find((f) => f.id === fileBId))
    : [];

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  function getColumnsFromFile(file?: FileInProject): string[] {
    if (!file || !file.data_schema_json) return [];
    try {
      const schema = JSON.parse(file.data_schema_json);
      return schema.columns?.map((c: any) => c.name) || [];
    } catch {
      return [];
    }
  }

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

  const handleCreateRelationship = async () => {
    if (!projectId || !fileAId || !fileBId || !leftKey || !rightKey) return;

    try {
      setCreating(true);
      setError(null);
      const rel = await api.createRelationship(parseInt(projectId), {
        file_a_id: fileAId,
        file_b_id: fileBId,
        join_type: joinType,
        left_key: leftKey,
        right_key: rightKey,
      });
      setRelationship(rel);
    } catch (err: any) {
      setError(err.message || "Failed to create relationship");
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyzeMerge = async () => {
    if (!projectId || !relationship) return;

    try {
      setAnalyzing(true);
      setError(null);
      const result = await api.analyzeMerge(parseInt(projectId), {
        relationship_id: relationship.id,
      });
      setMergeResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze merge");
    } finally {
      setAnalyzing(false);
    }
  };

  const getChartOption = (chart: any) => {
    const baseOption = {
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };

    switch (chart.chart_type) {
      case "line":
        return {
          ...baseOption,
          xAxis: {
            type: "category",
            data: chart.data.map((d: any) => d.x),
          },
          yAxis: { type: "value" },
          series: [
            {
              data: chart.data.map((d: any) => d.y),
              type: "line",
              smooth: true,
              itemStyle: { color: "#6366f1" },
            },
          ],
        };

      case "bar":
        return {
          ...baseOption,
          xAxis: {
            type: "category",
            data: chart.data.map((d: any) => d.category),
          },
          yAxis: { type: "value" },
          series: [
            {
              data: chart.data.map((d: any) => d.value),
              type: "bar",
              itemStyle: { color: "#6366f1" },
            },
          ],
        };

      case "pie":
        return {
          tooltip: { trigger: "item" },
          series: [
            {
              type: "pie",
              radius: "50%",
              data: chart.data.map((d: any) => ({
                name: d.name,
                value: d.value,
              })),
            },
          ],
        };

      default:
        return baseOption;
    }
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
              Please select a project from the Projects page to merge files.
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
            <h1 className="text-3xl font-bold">File Merging</h1>
            <p className="text-muted-foreground mt-1">
              Merge two files using SQL-like joins
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

        {/* Merge Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Merge</CardTitle>
            <CardDescription>
              Select files and join keys to create a merged dataset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Left File</Label>
                <Select
                  value={fileAId?.toString()}
                  onValueChange={(value) => setFileAId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select left file" />
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
                <Label>Right File</Label>
                <Select
                  value={fileBId?.toString()}
                  onValueChange={(value) => setFileBId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select right file" />
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

            <div>
              <Label>Join Type</Label>
              <Select
                value={joinType}
                onValueChange={(value: any) => setJoinType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inner">Inner Join</SelectItem>
                  <SelectItem value="left">Left Join</SelectItem>
                  <SelectItem value="right">Right Join</SelectItem>
                  <SelectItem value="outer">Outer Join</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Left Key Column</Label>
                <Select value={leftKey} onValueChange={setLeftKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileAColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Right Key Column</Label>
                <Select value={rightKey} onValueChange={setRightKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileBColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateRelationship}
              disabled={
                !fileAId ||
                !fileBId ||
                !leftKey ||
                !rightKey ||
                creating ||
                fileAId === fileBId
              }
              className="w-full"
            >
              <GitMerge className="mr-2 h-4 w-4" />
              {creating ? "Creating..." : "Create Relationship"}
            </Button>

            {fileAId === fileBId && fileAId && (
              <p className="text-sm text-orange-600">
                Please select two different files to merge
              </p>
            )}
          </CardContent>
        </Card>

        {/* Analyze Merge Button */}
        {relationship && !mergeResult && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleAnalyzeMerge}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? "Analyzing..." : "Analyze Merged Data"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Merge Results */}
        {mergeResult && (
          <div className="space-y-6">
            {/* Merge Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Merge Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  <strong>Rows in merged dataset:</strong>{" "}
                  {mergeResult.merged_row_count}
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Columns:</strong>{" "}
                  {mergeResult.merged_schema.columns.length}
                </p>
              </CardContent>
            </Card>

            {/* Global Summary */}
            {mergeResult.global_summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Merge Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{mergeResult.global_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            {mergeResult.charts && mergeResult.charts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mergeResult.charts.map((chart, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{chart.title}</CardTitle>
                      {chart.insight && (
                        <CardDescription className="mt-2">
                          {chart.insight}
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
          </div>
        )}

        {/* No Files Message */}
        {files.length < 2 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Not Enough Files</p>
              <p className="text-gray-600 text-center max-w-md mb-6">
                You need at least 2 files in this project to perform a merge.
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
