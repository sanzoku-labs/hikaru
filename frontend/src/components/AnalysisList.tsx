import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertCircle,
  BarChart3,
  Clock,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";
import { SavedAnalysisSummary } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface AnalysisListProps {
  analyses: SavedAnalysisSummary[];
  onViewAnalysis: (analysisId: number) => void;
  onDeleteAnalysis: (analysisId: number) => void;
  loading?: boolean;
}

export function AnalysisList({
  analyses,
  onViewAnalysis,
  onDeleteAnalysis,
  loading = false,
}: AnalysisListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<number | null>(null);

  const handleDeleteClick = (analysisId: number) => {
    setAnalysisToDelete(analysisId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (analysisToDelete !== null) {
      onDeleteAnalysis(analysisToDelete);
    }
    setDeleteDialogOpen(false);
    setAnalysisToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">No Saved Analyses</p>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            You haven't saved any analyses for this file yet. Generate an
            analysis to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.map((analysis) => (
          <Card
            key={analysis.analysis_id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="line-clamp-1">
                      {analysis.user_intent || "Automated Analysis"}
                    </span>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>{analysis.charts_count} charts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(analysis.created_at)}</span>
                  </div>
                </div>

                {/* User Intent Preview */}
                {analysis.user_intent && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {analysis.user_intent}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onViewAnalysis(analysis.analysis_id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Analysis
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(analysis.analysis_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              analysis and all its associated charts and insights.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
