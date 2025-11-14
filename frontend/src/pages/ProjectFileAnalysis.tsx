import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { FileAnalysisResponse } from "../types";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
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
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { ExportModal, ExportOptions } from "../components/charts/ExportModal";
import { InsightCard } from "../components/insights/InsightCard";

export default function ProjectFileAnalysis() {
  const { projectId, fileId } = useParams<{
    projectId: string;
    fileId: string;
  }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<FileAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Re-analyze dialog state
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false);
  const [userIntent, setUserIntent] = useState("");

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [projectId, fileId]);

  const loadAnalysis = async () => {
    if (!projectId || !fileId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjectFileAnalysis(
        parseInt(projectId),
        parseInt(fileId),
      );
      setAnalysis(data);
    } catch (err: any) {
      // If no analysis exists, show dialog to create one
      if (err.status === 404 && err.message.includes("No analysis found")) {
        setShowReanalyzeDialog(true);
      } else {
        setError(err.message || "Failed to load analysis");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!projectId || !fileId) return;

    try {
      setAnalyzing(true);
      setError(null);
      const data = await api.analyzeProjectFile(
        parseInt(projectId),
        parseInt(fileId),
        userIntent || undefined,
      );
      setAnalysis(data);
      setShowReanalyzeDialog(false);
      setUserIntent("");
    } catch (err: any) {
      setError(err.message || "Failed to analyze file");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    try {
      console.log("Exporting with options:", options);
      // TODO: Implement actual export API call
      alert(
        "Export functionality will be implemented with backend integration",
      );
      setExportModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Export failed");
      throw err;
    }
  };

  const getChartOption = (chart: any) => {
    const baseOption = {
      tooltip: {
        trigger: "axis" as const,
        axisPointer: {
          type: "shadow" as const,
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
    };

    switch (chart.chart_type) {
      case "line":
        return {
          ...baseOption,
          xAxis: {
            type: "category" as const,
            data: chart.data.map((d: any) => d[chart.x_column]),
            name: chart.x_column,
          },
          yAxis: {
            type: "value" as const,
            name: chart.y_column,
          },
          series: [
            {
              data: chart.data.map((d: any) => d[chart.y_column]),
              type: "line" as const,
              smooth: true,
              lineStyle: {
                color: "#6366f1",
                width: 2,
              },
              itemStyle: {
                color: "#6366f1",
              },
            },
          ],
        };

      case "bar":
        return {
          ...baseOption,
          xAxis: {
            type: "category" as const,
            data: chart.data.map(
              (d: any) => d[chart.x_column || chart.category_column],
            ),
            name: chart.x_column || chart.category_column,
            axisLabel: {
              rotate: 45,
            },
          },
          yAxis: {
            type: "value" as const,
            name: chart.y_column || chart.value_column,
          },
          series: [
            {
              data: chart.data.map(
                (d: any) => d[chart.y_column || chart.value_column],
              ),
              type: "bar" as const,
              itemStyle: {
                color: "#6366f1",
              },
            },
          ],
        };

      case "pie":
        return {
          tooltip: {
            trigger: "item" as const,
            formatter: "{a} <br/>{b}: {c} ({d}%)",
          },
          legend: {
            orient: "vertical" as const,
            left: "left",
          },
          series: [
            {
              name: chart.title,
              type: "pie" as const,
              radius: "50%",
              data: chart.data.map((d: any) => ({
                name: d[chart.category_column],
                value: d[chart.value_column],
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)",
                },
              },
            },
          ],
        };

      case "scatter":
        return {
          ...baseOption,
          xAxis: {
            type: "value" as const,
            name: chart.x_column,
          },
          yAxis: {
            type: "value" as const,
            name: chart.y_column,
          },
          series: [
            {
              data: chart.data.map((d: any) => [
                d[chart.x_column],
                d[chart.y_column],
              ]),
              type: "scatter" as const,
              itemStyle: {
                color: "#6366f1",
              },
            },
          ],
        };

      default:
        return baseOption;
    }
  };

  // Extract insights from global_summary or chart insights
  const extractInsights = () => {
    const insights = [];

    if (analysis?.global_summary) {
      // Split summary into sentences and take first 4
      const sentences = analysis.global_summary
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
    while (insights.length < 4 && analysis?.charts) {
      const chartIdx: number = insights.length;
      if (analysis.charts[chartIdx]?.insight) {
        insights.push({
          title: analysis.charts[chartIdx].title,
          description: analysis.charts[chartIdx].insight,
          color: (["blue", "green", "purple", "orange"] as const)[chartIdx % 4],
          icon: [TrendingUp, Target, Users, AlertTriangle][chartIdx % 4],
        });
      } else {
        break;
      }
    }

    return insights;
  };

  // Mock file stats (in real app, get from API)
  const fileStats = {
    fileSize: "2.4 MB",
    rows: analysis?.charts?.[0]?.data?.length || "15,847",
    columns: "12",
    dataQuality: "98.2%",
    missingValues: "284",
    lastModified: "2h ago",
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {analysis?.filename || "File Analysis"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                File analysis and insights •{" "}
                {analysis?.user_intent || "Automated Analysis"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
              Ask AI
            </Button>
          </div>
        </div>
      </header>

      {/* File Info Bar - 6 columns */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-6 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">File Size</p>
            <p className="text-lg font-semibold text-gray-900">
              {fileStats.fileSize}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Rows</p>
            <p className="text-lg font-semibold text-gray-900">
              {fileStats.rows}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Columns</p>
            <p className="text-lg font-semibold text-gray-900">
              {fileStats.columns}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Data Quality</p>
            <p className="text-lg font-semibold text-green-600">
              {fileStats.dataQuality}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Missing Values</p>
            <p className="text-lg font-semibold text-orange-600">
              {fileStats.missingValues}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Last Modified</p>
            <p className="text-lg font-semibold text-gray-900">
              {fileStats.lastModified}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="px-8 py-6 space-y-6 overflow-auto">
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
        {analysis?.charts && analysis.charts.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            {analysis.charts.map((chart: any, index: number) => (
              <Card
                key={index}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {chart.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ReactECharts
                    option={getChartOption(chart)}
                    style={{ height: "300px" }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistical Summary Section - 3 columns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Statistical Summary
          </h3>
          <div className="grid grid-cols-3 gap-8">
            {/* Column 1: Revenue Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">
                Revenue Metrics
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-medium text-gray-900">$2,847,392</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-medium text-gray-900">$179.64</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Median Order Value</span>
                <span className="font-medium text-gray-900">$142.30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Standard Deviation</span>
                <span className="font-medium text-gray-900">$87.21</span>
              </div>
            </div>

            {/* Column 2: Customer Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">
                Customer Metrics
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-medium text-gray-900">8,743</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Customers</span>
                <span className="font-medium text-gray-900">2,156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Returning Customers</span>
                <span className="font-medium text-gray-900">6,587</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Age</span>
                <span className="font-medium text-gray-900">42.3 years</span>
              </div>
            </div>

            {/* Column 3: Product Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">
                Product Metrics
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-medium text-gray-900">15,847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unique Products</span>
                <span className="font-medium text-gray-900">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Selling Product</span>
                <span className="font-medium text-gray-900">iPhone 14 Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Quantity</span>
                <span className="font-medium text-gray-900">2.1 items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality Report Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Data Quality Report
          </h3>
          <div className="space-y-4">
            {/* Quality Row - Excellent */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">customer_id</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">100% complete</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Excellent
                </span>
              </div>
            </div>

            {/* Quality Row - Good */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">order_date</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">100% complete</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Excellent
                </span>
              </div>
            </div>

            {/* Quality Row - Fair */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">customer_age</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">96.8% complete</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  Good
                </span>
              </div>
            </div>

            {/* Quality Row - Needs Attention */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium text-gray-900">region</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">94.2% complete</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                  Fair
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* No Charts Placeholder */}
        {(!analysis?.charts || analysis.charts.length === 0) && (
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
      </div>

      {/* Re-analyze Dialog */}
      <Dialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {analysis ? "Re-analyze File" : "Analyze File"}
            </DialogTitle>
            <DialogDescription>
              {analysis
                ? "Generate fresh analysis with a new intent or question."
                : "Generate charts and insights for this file."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="intent">Your Intent (Optional)</Label>
              <Input
                id="intent"
                placeholder="e.g., Show me sales trends by region..."
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-2">
                Describe what you want to understand about this data
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
              {analyzing ? "Analyzing..." : analysis ? "Re-analyze" : "Analyze"}
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
          analysis?.filename.replace(/\.[^/.]+$/, "") || "analysis"
        }
      />
    </Layout>
  );
}
