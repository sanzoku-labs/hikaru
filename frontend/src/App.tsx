import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { FileUploader } from '@/components/FileUploader'
import { DataPreview } from '@/components/DataPreview'
import { ChartGrid } from '@/components/ChartGrid'
import { GlobalSummary } from '@/components/GlobalSummary'
import { ChatInterface } from '@/components/ChatInterface'
import { ExportModal } from '@/components/ExportModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import type { UploadResponse, AnalyzeResponse } from '@/types'
import { RotateCcw, Download, Sparkles, ArrowRight } from 'lucide-react'

function App() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null)
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null)
  const [chartsLoading, setChartsLoading] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [showIntentStep, setShowIntentStep] = useState(false)
  const [userIntent, setUserIntent] = useState('')

  const handleAnalyze = async (intent?: string) => {
    if (!uploadData) return

    setChartsLoading(true)
    setShowIntentStep(false)

    try {
      const response = await api.analyzeData(uploadData.upload_id, intent)
      setAnalyzeData(response)
    } catch (error) {
      console.error('Failed to analyze data:', error)
    } finally {
      setChartsLoading(false)
    }
  }

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadData(data)
    setShowIntentStep(true)
  }

  const handleReset = () => {
    setUploadData(null)
    setAnalyzeData(null)
    setShowIntentStep(false)
    setUserIntent('')
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Action Bar */}
        {uploadData && analyzeData && (
          <div className="flex justify-end gap-2">
            <Button
              variant="default"
              onClick={() => setExportModalOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              New Upload
            </Button>
          </div>
        )}
        {!uploadData ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Quick Analysis</h2>
              <p className="text-muted-foreground">
                Upload your CSV or Excel file for instant AI-powered insights
              </p>
            </div>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : showIntentStep ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  What would you like to analyze?
                </CardTitle>
                <CardDescription>
                  Describe what insights you're looking for, or skip to let AI automatically suggest meaningful visualizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="e.g., I want to see sales trends by product over time..."
                    value={userIntent}
                    onChange={(e) => setUserIntent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userIntent.trim()) {
                        handleAnalyze(userIntent.trim())
                      }
                    }}
                    className="text-base"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze()}
                  >
                    Skip - Auto Generate
                  </Button>
                  <Button
                    onClick={() => handleAnalyze(userIntent.trim() || undefined)}
                    disabled={!userIntent.trim()}
                  >
                    Analyze with Intent
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <DataPreview
              schema={uploadData.data_schema}
              filename={uploadData.filename}
            />

            {analyzeData?.global_summary && (
              <GlobalSummary summary={analyzeData.global_summary} />
            )}

            <div>
              <h2 className="text-2xl font-bold mb-4">Generated Charts</h2>
              <ChartGrid
                charts={analyzeData?.charts || []}
                loading={chartsLoading}
              />
            </div>

            {analyzeData && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Ask Questions</h2>
                <ChatInterface uploadId={uploadData.upload_id} />
              </div>
            )}
          </div>
        )}
      </div>

      {uploadData && analyzeData && (
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          uploadId={uploadData.upload_id}
          filename={uploadData.filename}
        />
      )}
    </Layout>
  )
}

export default App
