import { useState, useEffect } from 'react'
import { FileUploader } from '@/components/FileUploader'
import { DataPreview } from '@/components/DataPreview'
import { ChartGrid } from '@/components/ChartGrid'
import { GlobalSummary } from '@/components/GlobalSummary'
import { ChatInterface } from '@/components/ChatInterface'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import type { UploadResponse, AnalyzeResponse } from '@/types'
import { RotateCcw } from 'lucide-react'

function App() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null)
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null)
  const [chartsLoading, setChartsLoading] = useState(false)

  // Auto-analyze after upload
  useEffect(() => {
    if (uploadData && !analyzeData) {
      const fetchCharts = async () => {
        setChartsLoading(true)
        try {
          const response = await api.analyzeData(uploadData.upload_id)
          setAnalyzeData(response)
        } catch (error) {
          console.error('Failed to analyze data:', error)
        } finally {
          setChartsLoading(false)
        }
      }
      fetchCharts()
    }
  }, [uploadData, analyzeData])

  const handleReset = () => {
    setUploadData(null)
    setAnalyzeData(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hikaru</h1>
            <p className="text-sm text-muted-foreground">AI Data Insight Board</p>
          </div>
          {uploadData && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              New Upload
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!uploadData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Upload Your Data</h2>
              <p className="text-muted-foreground">
                Transform your CSV or Excel data into actionable insights
              </p>
            </div>
            <FileUploader onUploadSuccess={setUploadData} />
          </div>
        ) : (
          <div className="space-y-8">
            <DataPreview
              schema={uploadData.schema}
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
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground text-center">
          Powered by Sanzoku Labs
        </div>
      </footer>
    </div>
  )
}

export default App
