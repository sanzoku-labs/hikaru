import { useState } from 'react'
import { FileUploader } from '@/components/FileUploader'
import { DataPreview } from '@/components/DataPreview'
import type { UploadResponse } from '@/types'

function App() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Hikaru</h1>
          <p className="text-sm text-muted-foreground">AI Data Insight Board</p>
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
