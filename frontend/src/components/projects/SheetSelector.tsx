import { useEffect, useState } from 'react';
import { SheetInfo } from '@/types';
import api from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SheetSelectorProps {
  projectId: number;
  fileId: number;
  open: boolean;
  onSelectSheet: (sheetName: string) => void;
  onCancel: () => void;
}

export function SheetSelector({
  projectId,
  fileId,
  open,
  onSelectSheet,
  onCancel,
}: SheetSelectorProps) {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSheets();
    }
  }, [open, projectId, fileId]);

  const loadSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const sheetsData = await api.getFileSheets(projectId, fileId, true);
      setSheets(sheetsData);
    } catch (err) {
      console.error('Failed to load sheets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sheets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Select Sheet to Analyze
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-sm text-gray-600">Loading sheets...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && sheets.length === 0 && (
          <Alert>
            <AlertDescription>
              No sheets found in this Excel file.
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && sheets.length > 0 && (
          <div className="space-y-3">
            {sheets.map((sheet) => (
              <Card
                key={sheet.index}
                className={`p-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-md ${
                  sheet.error ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (!sheet.error) {
                    onSelectSheet(sheet.name);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {sheet.name}
                      {sheet.is_hidden && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {sheet.row_count.toLocaleString()} rows × {sheet.column_count} cols
                    </Badge>
                    {sheet.has_numeric && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        Has Charts
                      </Badge>
                    )}
                  </div>
                </div>

                {sheet.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {sheet.error}
                    </AlertDescription>
                  </Alert>
                )}

                {!sheet.error && !sheet.has_numeric && (
                  <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-yellow-800">
                      No numeric columns found - charts may not be available
                    </AlertDescription>
                  </Alert>
                )}

                {sheet.preview && sheet.preview.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <div className="text-xs text-gray-500 mb-1">Preview (first 3 rows):</div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(sheet.preview[0] || {}).map((col) => (
                              <TableHead key={col} className="text-xs font-medium">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheet.preview.slice(0, 3).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {Object.values(row).map((val, colIndex) => (
                                <TableCell key={colIndex} className="text-xs py-1.5">
                                  {val === null || val === undefined
                                    ? <span className="text-gray-400 italic">null</span>
                                    : String(val).substring(0, 50)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
