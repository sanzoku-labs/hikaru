import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ComparisonToolbar } from "@/components/comparison/ComparisonToolbar";
import { SplitViewPanel } from "@/components/comparison/SplitViewPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";

// Mock data for demonstration
const mockFileA = {
  id: 1,
  name: "sales_q3_2024.csv",
  rows: 1245,
  columns: 12,
  size: "2.3 MB",
};

const mockFileB = {
  id: 2,
  name: "sales_q4_2024.csv",
  rows: 1387,
  columns: 12,
  size: "2.6 MB",
};

const mockColumns = [
  "ID",
  "Product",
  "Category",
  "Price",
  "Quantity",
  "Total",
  "Date",
  "Region",
  "Customer",
];

// Generate mock data
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ID: i + 1,
    Product: `Product ${i + 1}`,
    Category: ["Electronics", "Clothing", "Food", "Books"][i % 4],
    Price: (Math.random() * 100 + 10).toFixed(2),
    Quantity: Math.floor(Math.random() * 20) + 1,
    Total: (Math.random() * 1000 + 100).toFixed(2),
    Date: new Date(
      2024,
      8 + Math.floor(i / 100),
      (i % 28) + 1,
    ).toLocaleDateString(),
    Region: ["North", "South", "East", "West"][i % 4],
    Customer: `Customer ${Math.floor(Math.random() * 100) + 1}`,
  }));
};

const mockDataA = generateMockData(50);
const mockDataB = generateMockData(50);

// Mock differences (row index -> diff type)
const mockDifferences = {
  5: "added" as const,
  12: "added" as const,
  23: "removed" as const,
  34: "modified" as const,
  38: "modified" as const,
  41: "added" as const,
};

export function Comparisons() {
  const navigate = useNavigate();
  const [fileA] = useState(mockFileA);
  const [fileB] = useState(mockFileB);
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay">(
    "side-by-side",
  );
  const [syncScroll, setSyncScroll] = useState(true);

  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);

  // Calculate difference stats
  const diffStats = {
    additions: Object.values(mockDifferences).filter((d) => d === "added")
      .length,
    deletions: Object.values(mockDifferences).filter((d) => d === "removed")
      .length,
    modifications: Object.values(mockDifferences).filter(
      (d) => d === "modified",
    ).length,
  };

  const handleFileAClick = () => {
    // TODO: Open file selector dialog
    // File selector dialog implementation pending
  };

  const handleFileBClick = () => {
    // TODO: Open file selector dialog
    // File selector dialog implementation pending
  };

  const handleViewModeChange = (mode: "side-by-side" | "overlay") => {
    setViewMode(mode);
  };

  const handleSyncScrollToggle = () => {
    setSyncScroll(!syncScroll);
  };

  const handlePanelAScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (syncScroll && panelBRef.current) {
      panelBRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handlePanelBScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (syncScroll && panelARef.current) {
      panelARef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleGenerateMerge = () => {
    // TODO: Navigate to merge page with pre-selected files
    navigate("/merging");
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Comparison Toolbar */}
        <ComparisonToolbar
          fileA={fileA}
          fileB={fileB}
          viewMode={viewMode}
          syncScroll={syncScroll}
          onFileAClick={handleFileAClick}
          onFileBClick={handleFileBClick}
          onViewModeChange={handleViewModeChange}
          onSyncScrollToggle={handleSyncScrollToggle}
        />

        {/* Split View Panels */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <SplitViewPanel
              file={fileA}
              data={mockDataA}
              columns={mockColumns}
              role="original"
              onScroll={handlePanelAScroll}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <SplitViewPanel
              file={fileB}
              data={mockDataB}
              columns={mockColumns}
              role="comparison"
              differences={mockDifferences}
              onScroll={handlePanelBScroll}
            />
          </div>
        </div>

        {/* Comparison Summary Footer */}
        <div className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Difference Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                <span className="text-sm text-gray-600">
                  {diffStats.additions} additions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                <span className="text-sm text-gray-600">
                  {diffStats.deletions} deletions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
                <span className="text-sm text-gray-600">
                  {diffStats.modifications} modifications
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Diff
              </Button>
              <Button variant="outline" size="sm">
                Next Diff
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={handleGenerateMerge}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Merge
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
