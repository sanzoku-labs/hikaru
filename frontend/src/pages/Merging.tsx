import { useState } from "react";
import { Layout } from "@/components/Layout";
import { MergeFileCard } from "@/components/merging/MergeFileCard";
import { JoinConfigPanel } from "@/components/merging/JoinConfigPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

// Mock files for demonstration
const mockFiles = [
  {
    id: 1,
    name: "sales_data_q4.csv",
    rows: 12450,
    columns: 8,
    size: "2.3 MB",
  },
  {
    id: 2,
    name: "customer_data.csv",
    rows: 8743,
    columns: 6,
    size: "1.4 MB",
  },
  {
    id: 3,
    name: "product_catalog.csv",
    rows: 1247,
    columns: 5,
    size: "0.8 MB",
  },
];

const mockColumns = [
  "customer_id",
  "product_id",
  "order_id",
  "date",
  "amount",
  "quantity",
  "region",
  "category",
];

// Mock merged data for results preview
const generateMockMergedData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    customer_id: `C${1000 + i}`,
    order_id: `O${2000 + i}`,
    product_id: `P${300 + (i % 50)}`,
    customer_name: `Customer ${i + 1}`,
    product_name: `Product ${(i % 50) + 1}`,
    amount: (Math.random() * 500 + 50).toFixed(2),
    quantity: Math.floor(Math.random() * 10) + 1,
    date: new Date(2024, 9, (i % 30) + 1).toLocaleDateString(),
  }));
};

export function Merging() {
  const [selectedFiles, setSelectedFiles] = useState([
    mockFiles[0],
    mockFiles[1],
  ]);
  const [joinType, setJoinType] = useState<
    "inner" | "left" | "right" | "outer"
  >("inner");
  const [leftKey, setLeftKey] = useState("customer_id");
  const [rightKey, setRightKey] = useState("customer_id");
  const [duplicateHandling, setDuplicateHandling] = useState("keep_all");
  const [missingValuesHandling, setMissingValuesHandling] =
    useState("keep_null");
  const [outputFormat, setOutputFormat] = useState("csv");
  const [mergedData, setMergedData] = useState<any[] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAddFile = () => {
    // TODO: Open file selector dialog
    console.log("Add file");
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handlePreview = () => {
    // Generate mock preview data
    const mockData = generateMockMergedData(20);
    setMergedData(mockData);
    setShowResults(true);
  };

  const handleExecute = () => {
    // TODO: Call merge API
    const mockData = generateMockMergedData(100);
    setMergedData(mockData);
    setShowResults(true);
    alert("Merge executed successfully!");
  };

  const handleDownload = () => {
    alert(`Downloading merged data as ${outputFormat.toUpperCase()}...`);
  };

  const handleAnalyze = () => {
    alert("Analyzing merged data...");
  };

  // Calculate total stats
  const totalRows = selectedFiles.reduce((sum, file) => sum + file.rows, 0);
  const totalSize = selectedFiles
    .reduce((sum, file) => {
      const sizeMB = parseFloat(file.size.replace(" MB", ""));
      return sum + sizeMB;
    }, 0)
    .toFixed(2);

  return (
    <Layout>
      <div className="px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">File Merge</h1>
          <p className="text-sm text-gray-500">
            Combine multiple data files using SQL-like joins
          </p>
        </div>

        {/* Main Grid Layout: 4 columns (file selection) + 8 columns (configuration) */}
        <div className="grid grid-cols-12 gap-6">
          {/* File Selection Panel - Left Sidebar (4 columns) */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Files
                </h3>
                <Button
                  onClick={handleAddFile}
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* File Cards */}
              <div className="space-y-3 mb-6">
                {selectedFiles.map((file, index) => (
                  <MergeFileCard
                    key={file.id}
                    file={file}
                    role={
                      index === 0
                        ? "primary"
                        : index === 1
                          ? "secondary"
                          : "additional"
                    }
                    onRemove={
                      selectedFiles.length > 2
                        ? () => handleRemoveFile(index)
                        : undefined
                    }
                  />
                ))}
              </div>

              {/* Merge Stats */}
              <div className="pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Rows</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalRows.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Size</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalSize} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Panel - Right (8 columns) */}
          <div className="col-span-8">
            <JoinConfigPanel
              joinType={joinType}
              leftKey={leftKey}
              rightKey={rightKey}
              availableColumns={mockColumns}
              duplicateHandling={duplicateHandling}
              missingValuesHandling={missingValuesHandling}
              outputFormat={outputFormat}
              onJoinTypeChange={setJoinType}
              onLeftKeyChange={setLeftKey}
              onRightKeyChange={setRightKey}
              onDuplicateHandlingChange={setDuplicateHandling}
              onMissingValuesHandlingChange={setMissingValuesHandling}
              onOutputFormatChange={setOutputFormat}
              onPreview={handlePreview}
              onExecute={handleExecute}
            />
          </div>
        </div>

        {/* Results Section - Full Width */}
        {showResults && mergedData && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Merged Results
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {mergedData.length} rows •{" "}
                  {Object.keys(mergedData[0] || {}).length} columns
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={handleDownload}>
                  Download
                </Button>
                <Button onClick={handleAnalyze}>Analyze</Button>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-auto max-h-[400px] border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {mergedData.length > 0 &&
                      Object.keys(mergedData[0]).map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                        >
                          {col}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mergedData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {Object.values(row).map((value: any, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing 1 to {Math.min(20, mergedData.length)} of{" "}
                {mergedData.length} rows
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Badge variant="secondary">1</Badge>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
