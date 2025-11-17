# Hikaru - Phase 1 Development Prompt for Claude Code

## Project Context

I'm building **Hikaru**, an AI-powered data insight dashboard that transforms CSV/Excel files into interactive BI dashboards with AI-generated insights.

**Full PRD:** See `DSB_PRD_v1.1.md` for complete specifications.

---

## Phase 1 Goal: Foundation - File Upload + Data Preview

Create a working monorepo with file upload functionality and data preview.

---

## Stack Requirements

### Backend
- **Python 3.11+** with FastAPI
- **Pandas** for data processing
- **Pydantic v2** for validation
- **python-multipart** for file uploads
- **openpyxl** for Excel parsing
- **python-dotenv** for environment variables
- **uvicorn** as ASGI server

### Frontend
- **React 18** with TypeScript
- **Vite** as build tool
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **lucide-react** for icons (comes with shadcn/ui)
- **axios** or **fetch** for API calls

---

## Project Structure

```
hikaru/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Settings from .env
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── upload.py       # POST /api/upload endpoint
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── data_processor.py   # Pandas data processing
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py          # Pydantic models
│   ├── tests/
│   │   └── __init__.py
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components (auto-generated)
│   │   │   ├── FileUploader.tsx
│   │   │   └── DataPreview.tsx
│   │   ├── services/
│   │   │   └── api.ts              # API client
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   ├── lib/
│   │   │   └── utils.ts            # shadcn/ui utilities
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── components.json             # shadcn/ui config
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── sample-data/
│   ├── sales_by_region.csv
│   └── monthly_revenue.csv
├── .gitignore
└── README.md
```

---

## Backend Implementation

### 1. `backend/requirements.txt`
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pandas==2.1.3
openpyxl==3.1.2
python-multipart==0.0.6
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

### 2. `backend/.env.example`
```env
# Server
HOST=0.0.0.0
PORT=8000
RELOAD=true

# CORS
CORS_ORIGINS=http://localhost:5173

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=csv,xlsx

# Future: AI
ANTHROPIC_API_KEY=your_key_here
```

### 3. `backend/app/config.py`
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # CORS
    cors_origins: List[str] = ["http://localhost:5173"]
    
    # File Upload
    max_file_size_mb: int = 10
    allowed_extensions: List[str] = ["csv", "xlsx"]
    
    # Future
    anthropic_api_key: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 4. `backend/app/models/schemas.py`
```python
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime

class ColumnInfo(BaseModel):
    name: str
    type: Literal["numeric", "categorical", "datetime"]
    null_count: int
    unique_values: Optional[int] = None
    sample_values: List[Any]
    # For numeric columns
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None

class DataSchema(BaseModel):
    columns: List[ColumnInfo]
    row_count: int
    preview: List[Dict[str, Any]]  # First 10 rows

class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    schema: DataSchema
    upload_timestamp: datetime
    
class ErrorResponse(BaseModel):
    error: str
    detail: str
    code: Optional[str] = None
```

### 5. `backend/app/services/data_processor.py`
```python
import pandas as pd
import numpy as np
from typing import Tuple, Optional
from app.models.schemas import DataSchema, ColumnInfo

class DataProcessor:
    @staticmethod
    def parse_file(file_path: str, file_extension: str) -> pd.DataFrame:
        """Parse CSV or Excel file into DataFrame"""
        if file_extension == 'csv':
            return pd.read_csv(file_path, encoding='utf-8')
        elif file_extension in ['xlsx', 'xls']:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}")
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> Tuple[bool, Optional[str]]:
        """Validate dataframe meets requirements"""
        # Row count check
        if len(df) > 100_000:
            return False, f"Too many rows: {len(df)} (limit: 100,000)"
        
        if len(df) < 2:
            return False, "Insufficient data (minimum: 2 rows)"
        
        # Column count check
        if len(df.columns) > 50:
            return False, f"Too many columns: {len(df.columns)} (limit: 50)"
        
        # Check for at least one numeric column
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) == 0:
            return False, "No numeric columns found for visualization"
        
        return True, None
    
    @staticmethod
    def detect_column_type(series: pd.Series) -> str:
        """Detect column type: numeric, categorical, or datetime"""
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        
        # Try to convert to datetime
        if series.dtype == 'object':
            try:
                pd.to_datetime(series.dropna().head(100))
                return "datetime"
            except:
                pass
        
        # Check for numeric
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"
        
        # Default to categorical
        return "categorical"
    
    @staticmethod
    def analyze_schema(df: pd.DataFrame) -> DataSchema:
        """Analyze dataframe and generate schema"""
        columns_info = []
        
        for col in df.columns:
            series = df[col]
            col_type = DataProcessor.detect_column_type(series)
            
            col_info = ColumnInfo(
                name=col,
                type=col_type,
                null_count=int(series.isnull().sum()),
                unique_values=int(series.nunique()) if col_type == "categorical" else None,
                sample_values=series.dropna().head(5).tolist()
            )
            
            # Add numeric stats
            if col_type == "numeric":
                col_info.min = float(series.min())
                col_info.max = float(series.max())
                col_info.mean = float(series.mean())
                col_info.median = float(series.median())
            
            columns_info.append(col_info)
        
        # Get preview (first 10 rows)
        preview = df.head(10).replace({np.nan: None}).to_dict('records')
        
        return DataSchema(
            columns=columns_info,
            row_count=len(df),
            preview=preview
        )
```

### 6. `backend/app/api/routes/upload.py`
```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import UploadResponse, ErrorResponse
from app.services.data_processor import DataProcessor
from app.config import settings
import uuid
from datetime import datetime
import os
import shutil

router = APIRouter(prefix="/api", tags=["upload"])

# Temporary storage (in-memory for MVP, will use proper storage later)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV or XLSX file for analysis"""
    
    # Validate file extension
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions)}"
        )
    
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    max_size_bytes = settings.max_file_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file_size / 1024 / 1024:.2f}MB (limit: {settings.max_file_size_mb}MB)"
        )
    
    # Generate upload ID and save file
    upload_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}.{file_extension}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse and analyze file
        processor = DataProcessor()
        df = processor.parse_file(file_path, file_extension)
        
        # Validate dataframe
        is_valid, error_msg = processor.validate_dataframe(df)
        if not is_valid:
            os.remove(file_path)  # Clean up
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Generate schema
        schema = processor.analyze_schema(df)
        
        return UploadResponse(
            upload_id=upload_id,
            filename=file.filename,
            schema=schema,
            upload_timestamp=datetime.now()
        )
        
    except pd.errors.ParserError as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
```

### 7. `backend/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import upload

app = FastAPI(
    title="Hikaru API",
    description="AI Data Insight Board API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )
```

---

## Frontend Implementation

### 1. Initialize shadcn/ui

After creating the Vite + React + TypeScript project, run:

```bash
npx shadcn-ui@latest init
```

Select these options:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then add required components:
```bash
npx shadcn-ui@latest add button card input label table badge alert skeleton progress separator scroll-area
```

### 2. `frontend/src/types/index.ts`

Mirror the backend Pydantic models:

```typescript
export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime';
  null_count: number;
  unique_values?: number;
  sample_values: any[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
}

export interface DataSchema {
  columns: ColumnInfo[];
  row_count: number;
  preview: Record<string, any>[];
}

export interface UploadResponse {
  upload_id: string;
  filename: string;
  schema: DataSchema;
  upload_timestamp: string;
}

export interface ErrorResponse {
  error: string;
  detail: string;
  code?: string;
}
```

### 3. `frontend/src/services/api.ts`

```typescript
import type { UploadResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error || 'Upload failed',
        response.status,
        error.detail
      )
    }

    return response.json()
  },
}
```

### 4. `frontend/src/components/FileUploader.tsx`

```typescript
import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { api, ApiError } from '@/services/api'
import type { UploadResponse } from '@/types'

interface FileUploaderProps {
  onUploadSuccess: (data: UploadResponse) => void
}

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    setError(null)
    
    // Validate file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      setError('Invalid file type. Please upload a CSV or Excel file.')
      return
    }
    
    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError(`File too large. Maximum size: 10MB`)
      return
    }
    
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const response = await api.uploadFile(file)
      onUploadSuccess(response)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message)
      } else {
        setError('Upload failed. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors
              ${dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drag & drop your file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports CSV and Excel files (max 10MB)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading and analyzing...
                </p>
              </div>
            )}

            {!uploading && (
              <Button onClick={handleUpload} className="w-full" size="lg">
                Analyze Data
              </Button>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

### 5. `frontend/src/components/DataPreview.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DataSchema } from '@/types'

interface DataPreviewProps {
  schema: DataSchema
  filename: string
}

export function DataPreview({ schema, filename }: DataPreviewProps) {
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'numeric':
        return 'default'
      case 'categorical':
        return 'secondary'
      case 'datetime':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Preview</CardTitle>
        <CardDescription>
          {filename} • {schema.row_count.toLocaleString()} rows • {schema.columns.length} columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {schema.columns.map((col) => (
                  <TableHead key={col.name}>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{col.name}</span>
                      <Badge variant={getTypeBadgeVariant(col.type)} className="w-fit">
                        {col.type}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schema.preview.map((row, idx) => (
                <TableRow key={idx}>
                  {schema.columns.map((col) => (
                    <TableCell key={`${idx}-${col.name}`}>
                      {row[col.name] != null ? String(row[col.name]) : (
                        <span className="text-muted-foreground italic">null</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

### 6. `frontend/src/App.tsx`

```typescript
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
```

---

## Sample Data Files

### `sample-data/sales_by_region.csv`
```csv
region,revenue,units_sold,quarter
North,125000,450,Q1
South,98000,380,Q1
East,145000,520,Q1
West,112000,430,Q1
North,135000,480,Q2
South,105000,395,Q2
East,155000,545,Q2
West,118000,445,Q2
```

### `sample-data/monthly_revenue.csv`
```csv
month,revenue,expenses,profit
2024-01-01,50000,35000,15000
2024-02-01,55000,37000,18000
2024-03-01,52000,36000,16000
2024-04-01,58000,39000,19000
2024-05-01,61000,40000,21000
2024-06-01,59000,38000,21000
```

---

## Success Criteria

### Backend
- [x] FastAPI app starts without errors
- [x] POST /api/upload accepts CSV/XLSX files
- [x] File validation works (size, type)
- [x] Schema detection correctly identifies column types
- [x] Data preview returns first 10 rows
- [x] Proper error handling with meaningful messages

### Frontend
- [x] Vite app starts without errors
- [x] shadcn/ui components render correctly
- [x] File drag-drop works
- [x] File upload shows progress
- [x] Data preview table displays with column types
- [x] Error states display properly
- [x] Responsive on desktop and tablet

---

## Next Steps After Phase 1

Once this foundation is working:
1. **Phase 2:** Add chart generation service
2. **Phase 3:** Integrate AI insights (Anthropic API)
3. **Phase 4:** Add Q&A interface
4. **Phase 5:** Implement PDF export
5. **Phase 6:** Polish and testing

---

## Development Commands

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Test Upload
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@sample-data/sales_by_region.csv"
```

---

## Important Notes

1. **Always use absolute imports** in backend (`from app.models.schemas import ...`)
2. **shadcn/ui components** are copied into your project (not npm packages)
3. **TypeScript types** should match Pydantic models exactly
4. **Error handling** is critical - every endpoint should have try/catch
5. **File cleanup** - delete uploaded files after 1 hour (implement later)
6. **CORS** - configured for localhost:5173 (Vite default port)

---

Ready to start? Run this prompt in Claude Code and let's build Phase 1! 🚀
