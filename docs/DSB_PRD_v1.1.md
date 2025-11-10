# 🧾 Hikaru – AI Data Insight Board

**Version:** v1.1 – PRD Refined  
**Owner:** Sovanaryth (Yuzhou)  
**Date:** November 2025  
**Status:** Ready for Implementation

---

## 1. 🎯 Vision & Purpose

**Hikaru (Data Smart Board)** is a lightweight, intelligent dashboard generator that transforms **CSV or Excel data** into **interactive BI dashboards** enhanced by **AI-generated insights**.  
It bridges the gap between data analysis and storytelling: upload → understand → explain → export.  

The goal is to let non-technical users gain instant insights without needing to code or use complex BI tools like Power BI or Tableau.

---

## 2. 🧱 Core Objectives

- Enable users to **upload any CSV/XLSX file** and visualize data automatically.  
- Use **AI to generate charts, insights, and global summaries**.  
- Provide **an intuitive interface** to ask natural-language questions about the dataset.  
- Allow users to **export** dashboards as reports (PDF or PPTX).  
- Offer optional **persistence** to save dashboards and retrieve them later.

---

## 3. 🧩 Feature Set

### 3.1 MVP Features
| Category | Feature | Description | Specifications |
|-----------|----------|-------------|----------------|
| File Handling | File Upload | Upload CSV/XLSX files (drag-drop or click) | Max 10MB, .csv/.xlsx only |
| Data Constraints | Row Limit | Maximum rows per analysis | 100,000 rows |
| Data Constraints | Column Limit | Maximum columns for auto-viz | 50 columns |
| Data Parsing | Schema Detection | Automatically infer column types and detect missing values | Detect: numeric, categorical, datetime |
| Visualization | Auto Chart Generation | Suggest 3-4 charts based on data types and relationships | See Section 4.5 for heuristics |
| AI Insights | Chart Insights | Generate per-chart insight summaries (e.g., "Sales peaked in Q3") | 2-3 sentences per chart |
| AI Insights | Global Summary | Synthesize overall trends and patterns across all charts | 3-4 sentence executive summary |
| Q&A | Prompt Interface | Allow users to ask "What's the top category by revenue?" etc. | Natural language queries |
| Export | PDF Export | Generate a report with charts and insights | Single PDF with all visualizations |
| Persistence | Dashboard Save | Store dashboards and reload later (SQLite/Postgres) | Post-MVP feature |

### 3.2 Post-MVP Enhancements

**Phase 7: Projects & Multi-File Organization (Priority 1)**
- **Projects/Workspaces:** Group multiple file uploads under a project
- **Cross-file analysis:** Compare and correlate data across files
- **Project dashboard:** Overview of all files in a project
- **File relationships:** Define joins/merges between datasets
- **Shared context:** AI insights that span multiple files

**Phase 8: Collaboration & Sharing**
- User authentication & multi-tenant dashboards  
- Collaboration (shareable links, comments)  
- Team workspaces

**Phase 9: Advanced Features**
- Scheduled email reports  
- Custom chart design and filters  
- Theming and brand customization  
- PPTX export with editable slides
- Increased limits (50MB files, 1M rows)

---

## 4. 🧠 User Journey & Interaction Flow

### 4.1 Primary User Flow (MVP)

1. **Upload Phase**  
   → User uploads file (CSV/XLSX)  
   → System validates file (size, format, encoding)  
   → Preview shows first 10 rows + schema

2. **Analysis Mode Selection**  
   → **Quick Start (Default):** Skip prompt → auto-generate standard charts  
   → **Guided Analysis (Optional):** User provides focus  
   &nbsp;&nbsp;&nbsp;Examples: "Compare sales by region", "Find anomalies in expenses", "Show quarterly trends"

3. **Auto-Visualization Phase**  
   → Hikaru analyzes data schema  
   → Generates 3-4 relevant charts based on heuristics (Section 4.5)  
   → Charts appear progressively with loading states

4. **Insight Generation Phase**  
   → LLM produces per-chart insights (2-3 sentences each)  
   → Global summary synthesizes overall patterns  
   → Insights display with confidence indicators

5. **Interactive Q&A Phase**  
   → User asks contextual questions:  
   &nbsp;&nbsp;&nbsp;"What's the biggest contributor?"  
   &nbsp;&nbsp;&nbsp;"Why did revenue drop in Q4?"  
   &nbsp;&nbsp;&nbsp;"Show correlation between X and Y"  
   → Charts may update dynamically based on queries

6. **Export Phase**  
   → User selects export format (PDF for MVP)  
   → System generates report with charts + insights  
   → Download link provided (< 5 seconds)

### 4.2 User Prompt Modes

**Quick Start (Default Mode)**
- No user input required
- System generates standard chart set based on data types
- Best for exploratory analysis
- UI: Large "Analyze Data" button

**Guided Analysis (Optional Mode)**
- User provides 1-2 sentence focus
- System extracts: dimensions to compare, metrics to focus on, analysis type
- Tailors chart selection to user intent
- UI: Optional text field with helpful placeholders:
  - "Compare revenue across regions"
  - "Identify sales trends over time"
  - "Find outliers in customer spending"

### 4.3 State Management

- **Upload State:** File validation, parsing progress
- **Analysis State:** Chart generation progress (1/4, 2/4...)
- **Insight State:** AI processing indicator
- **Query State:** Question submission, response streaming
- **Export State:** Generation progress, download ready

---

## 5. 📊 Chart Selection & Visualization Logic

### 5.1 Chart Type Heuristics

The system analyzes the data schema and applies these rules in priority order:

| Priority | Data Pattern | Chart Type | Condition | Example |
|----------|--------------|------------|-----------|---------|
| 1 | Datetime + Numeric | Line Chart | Any datetime column found | Monthly revenue trend |
| 2 | Categorical (≤8 values) + Numeric | Pie Chart | For proportions/shares | Market share by segment |
| 3 | Categorical + Numeric | Bar Chart | Default categorical viz | Sales by region |
| 4 | 2+ Numeric columns | Scatter Plot | Show top 2 by correlation | Price vs quantity |
| 5 | Datetime + 2 Numeric | Multi-line Chart | Compare metrics over time | Revenue vs expenses |
| 6 | 2 Categorical + Numeric | Grouped Bar | Multi-dimensional breakdown | Sales by region & quarter |
| 7 | Single Numeric | Histogram | Only if no better option | Distribution of ages |

### 5.2 Chart Selection Algorithm

```
1. Identify column types (numeric, categorical, datetime)
2. Check for datetime columns:
   - If found: Generate time series chart (Priority 1)
3. Find categorical columns with high cardinality:
   - If ≤8 unique values: Consider pie chart (Priority 2)
   - If >8 values: Use bar chart (Priority 3)
4. Calculate correlations between numeric columns:
   - If |correlation| > 0.5: Generate scatter plot (Priority 4)
5. Look for multi-dimensional patterns:
   - If 2+ categorical + numeric: Generate grouped chart (Priority 6)
6. Fill remaining slots with:
   - Additional bar charts for other categorical breakdowns
   - Histograms for distribution analysis (Priority 7)

Maximum: 4 charts for MVP to avoid overwhelming users
```

### 5.3 Chart Configuration

Each chart returns an ECharts-compatible JSON config:

```json
{
  "chart_id": "chart_001",
  "title": "Revenue by Region",
  "chart_type": "bar",
  "echarts_config": {
    "title": { "text": "Revenue by Region", "left": "center" },
    "tooltip": { "trigger": "axis" },
    "xAxis": { "type": "category", "data": ["North", "South", "East", "West"] },
    "yAxis": { "type": "value", "name": "Revenue ($)" },
    "series": [{
      "name": "Revenue",
      "type": "bar",
      "data": [125000, 98000, 145000, 112000],
      "itemStyle": { "color": "#5470c6" }
    }]
  },
  "data_summary": {
    "x_column": "region",
    "y_column": "revenue",
    "top_value": { "region": "East", "revenue": 145000 },
    "metric": "sum"
  },
  "insight": "East region leads with $145K in revenue, 18% above average."
}
```

---

## 6. 🤖 AI Integration & Prompt Engineering

### 6.1 Model Selection

| Use Case | Model | Rationale |
|----------|-------|-----------|
| Chart Insights | Claude Sonnet 4 | Fast, structured output, cost-effective |
| Global Summary | Claude Sonnet 4 | Synthesis across multiple insights |
| Complex Q&A | Claude Sonnet 4 | Deep reasoning, contextual understanding |
| Fallback | GPT-4o-mini | If Anthropic API unavailable |

### 6.2 Per-Chart Insight Prompt Template

```
You are a data analyst providing insights on a business dashboard.

CHART CONTEXT:
- Chart Type: {chart_type}
- Dataset: {dataset_name}
- X-axis: {x_column} ({x_type})
- Y-axis: {y_column} ({y_type})

DATA SUMMARY:
{data_summary_json}

KEY VALUES:
- Highest: {max_value} ({max_label})
- Lowest: {min_value} ({min_label})
- Average: {avg_value}
- Trend: {trend_direction} (if applicable)

TASK:
Provide a 2-3 sentence insight that:
1. States the most important finding (what stands out?)
2. Identifies a specific trend, comparison, or anomaly
3. Uses concrete numbers and percentages
4. Is actionable and business-relevant

TONE: Professional but conversational. Avoid jargon.
FORMAT: Plain text, no bullet points.

Example good insight:
"East region leads with $145K in revenue, representing 28% of total sales and outperforming the company average by 18%. This strong performance is driven primarily by Q3 results, which peaked at $52K."

Example bad insight:
"The data shows regional variations. Some regions perform better than others."
```

### 6.3 Global Summary Prompt Template

```
You are synthesizing insights from multiple data visualizations into an executive summary.

DASHBOARD CONTEXT:
- Dataset: {dataset_name}
- Number of Charts: {chart_count}
- Analysis Type: {analysis_type}
- User Focus: {user_prompt} (if provided)

INDIVIDUAL CHART INSIGHTS:
{formatted_chart_insights}

TASK:
Provide a 3-4 sentence executive summary that:
1. Identifies the single most important finding across all charts
2. Connects patterns or relationships between different views
3. Highlights any concerning trends or opportunities
4. Suggests one concrete, actionable recommendation

REQUIREMENTS:
- Start with the highest-impact insight
- Use specific numbers and percentages
- Make cross-chart connections explicit
- End with a clear recommendation or next step

TONE: Executive-level, strategic, actionable.
FORMAT: Single paragraph, no headers or bullets.

Example:
"Revenue analysis reveals East region as the strongest performer at $145K (28% of total), driven by exceptional Q3 results that peaked 35% above baseline. However, Q4 shows a concerning 12% decline across all regions, suggesting market-wide headwinds. The correlation between marketing spend and revenue (r=0.78) indicates that reallocating 15% of budget from underperforming West region to high-growth East could yield an estimated $25K incremental revenue in Q1."
```

### 6.4 Q&A Prompt Template

```
You are answering a user's question about their data dashboard.

CONVERSATION CONTEXT:
- Dataset: {dataset_name}
- Available Charts: {chart_titles}
- Previous Insights: {global_summary}

USER QUESTION:
"{user_question}"

RELEVANT DATA:
{filtered_data_subset}

TASK:
1. Answer the question directly and concisely
2. Reference specific chart data when relevant
3. If the question requires a new visualization, suggest it
4. If data is insufficient, say so clearly

RESPONSE FORMAT:
- Direct answer (1-2 sentences)
- Supporting evidence from charts (if applicable)
- Suggestion for deeper analysis (optional)

Example interaction:
Q: "Why did revenue drop in Q4?"
A: "Revenue declined 12% in Q4 across all regions, from an average of $132K to $116K. The line chart shows this coincides with a 15% decrease in units sold, suggesting a volume issue rather than pricing. Consider analyzing the customer acquisition data for Q4 to identify potential retention problems."
```

### 6.5 Caching Strategy

To minimize LLM costs and latency:

- **Data Fingerprinting:** Hash dataset (columns + sample rows)
- **Cache Insights:** Store insights by `{data_hash}_{chart_config_hash}` for 24 hours
- **Cache Global Summaries:** Store by `{data_hash}_{chart_set_hash}` for 24 hours
- **Q&A Context:** Include last 3 Q&A exchanges in prompt (rolling context window)
- **Invalidation:** Clear cache on new file upload or user-requested refresh

---

## 7. ⚙️ Technical Architecture

### 7.1 Stack Overview
| Layer | Technology | Notes |
|--------|-------------|-------|
| Frontend | React 18 + Vite + TypeScript | UI layer |
| UI Components | shadcn/ui | Pre-built accessible components |
| Styling | Tailwind CSS v3 | Utility-first styling |
| Charts | ECharts v5 | Interactive visualizations |
| State | Zustand or Context API | Lightweight state management |
| Forms | React Hook Form + Zod | Form validation |
| Backend | FastAPI (Python 3.11+) | Async API server |
| Data Engine | Pandas + DuckDB | Fast local analytics |
| AI | Anthropic Claude Sonnet 4 | Insights + summaries |
| Validation | Pydantic v2 | Schema validation |
| DB | SQLite → Postgres (later) | Dashboard persistence |
| Storage | Local filesystem → Supabase (later) | File storage |
| Export | WeasyPrint | PDF generation |
| Testing | Pytest + Vitest | Backend + frontend tests |

### 7.1a shadcn/ui Components Used

The following shadcn/ui components will be used throughout the application:

| Component | Usage | Priority |
|-----------|-------|----------|
| Button | Primary actions, export, analyze | Phase 1 |
| Card | Chart containers, insight panels | Phase 1 |
| Dialog | Export modal, confirmation dialogs | Phase 5 |
| Input | File name, query input | Phase 1 |
| Label | Form labels | Phase 1 |
| Table | Data preview | Phase 1 |
| Tabs | Switch between views (optional) | Phase 6 |
| Badge | Confidence indicators, status | Phase 3 |
| Alert | Error messages, warnings | Phase 1 |
| Skeleton | Loading states | Phase 2 |
| Progress | Upload/export progress | Phase 1 |
| Textarea | User prompts (guided analysis) | Phase 2 |
| Select | Chart type selection (manual) | Phase 6 |
| Tooltip | Chart explanations, help text | Phase 2 |
| Separator | Visual dividers | Phase 1 |
| ScrollArea | Long data previews | Phase 1 |

**Installation:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input label table badge alert skeleton progress textarea select tooltip separator scroll-area
```

**Theming:**
The default shadcn/ui theme will be customized with Hikaru brand colors:
- Primary: `hsl(220, 70%, 60%)` (blue #5470c6)
- Background: `hsl(210, 20%, 98%)` (light gray #f9fafb)
- Card: `hsl(0, 0%, 100%)` (white)
- Muted: `hsl(210, 15%, 95%)` (lighter gray)



### 7.2 Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │  Upload  │  Charts  │  Q&A     │  Export          │ │
│  │  Component│  Grid   │ Interface│  Modal           │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
│                         ↓ HTTP/REST                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes                                       │  │
│  │  /upload  /analyze  /query  /export  /dashboards │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────┬────────────────┬──────────────────┐  │
│  │ Data         │ Chart          │ AI Service       │  │
│  │ Processor    │ Generator      │ (Claude API)     │  │
│  │ (Pandas)     │ (Heuristics)   │                  │  │
│  └──────────────┴────────────────┴──────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Data Layer                                       │  │
│  │  DuckDB (analytics) + SQLite (persistence)       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 7.3 API Specification

#### POST /api/upload
Upload a data file for analysis.

**Request:**
```
Content-Type: multipart/form-data
- file: CSV or XLSX file (max 10MB)
```

**Response (200):**
```json
{
  "upload_id": "uuid-string",
  "filename": "sales_data.csv",
  "schema": {
    "columns": [
      {
        "name": "region",
        "type": "categorical",
        "null_count": 0,
        "unique_values": 4,
        "sample_values": ["North", "South", "East", "West"]
      },
      {
        "name": "revenue",
        "type": "numeric",
        "null_count": 2,
        "min": 45000,
        "max": 145000,
        "mean": 95000
      }
    ],
    "row_count": 24,
    "preview": [
      {"region": "North", "revenue": 125000, "quarter": "Q1"},
      {"region": "South", "revenue": 98000, "quarter": "Q1"}
    ]
  }
}
```

**Error (400):**
```json
{
  "error": "File too large",
  "detail": "File size 15MB exceeds limit of 10MB",
  "max_size_mb": 10
}
```

#### POST /api/analyze
Generate charts and insights for uploaded data.

**Request:**
```json
{
  "upload_id": "uuid-string",
  "user_prompt": "Compare sales by region and identify trends" // optional
}
```

**Response (200):**
```json
{
  "charts": [
    {
      "chart_id": "chart_001",
      "title": "Revenue by Region",
      "chart_type": "bar",
      "echarts_config": { /* ECharts config object */ },
      "data_summary": {
        "x_column": "region",
        "y_column": "revenue",
        "top_value": {"region": "East", "revenue": 145000}
      },
      "insight": "East region leads with $145K in revenue...",
      "confidence": "high"
    }
  ],
  "global_insight": "Revenue analysis reveals East region as...",
  "processing_time_ms": 3450
}
```

#### POST /api/query
Ask questions about the analyzed data.

**Request:**
```json
{
  "upload_id": "uuid-string",
  "question": "Why did revenue drop in Q4?",
  "context": {
    "charts": ["chart_001", "chart_002"],
    "previous_qa": [
      {"q": "What's the top region?", "a": "East with $145K"}
    ]
  }
}
```

**Response (200):**
```json
{
  "answer": "Revenue declined 12% in Q4 across all regions...",
  "updated_charts": [
    /* Optional: new/modified charts if question triggered re-analysis */
  ],
  "suggestions": [
    "Analyze customer retention in Q4",
    "Compare Q4 performance year-over-year"
  ]
}
```

#### POST /api/export
Generate downloadable report.

**Request:**
```json
{
  "upload_id": "uuid-string",
  "format": "pdf",
  "options": {
    "include_raw_data": false,
    "chart_ids": ["chart_001", "chart_002"] // optional filter
  }
}
```

**Response (200):**
```json
{
  "download_url": "/downloads/report_uuid.pdf",
  "expires_at": "2025-11-10T15:30:00Z",
  "file_size_kb": 245
}
```

#### GET /api/dashboards (Post-MVP)
Retrieve saved dashboards.

**Response (200):**
```json
{
  "dashboards": [
    {
      "dashboard_id": "uuid",
      "name": "Q3 Sales Analysis",
      "created_at": "2025-11-01T10:00:00Z",
      "chart_count": 4,
      "thumbnail_url": "/thumbnails/uuid.png"
    }
  ]
}
```

### 7.4 Data Models (Pydantic)

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
    # For numeric columns:
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None

class DataSchema(BaseModel):
    columns: List[ColumnInfo]
    row_count: int
    preview: List[Dict[str, Any]]  # First 10 rows

class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    schema: DataSchema
    upload_timestamp: datetime

class ChartConfig(BaseModel):
    chart_id: str
    title: str
    chart_type: Literal["bar", "line", "scatter", "pie", "histogram"]
    echarts_config: Dict[str, Any]
    data_summary: Dict[str, Any]
    insight: str
    confidence: Literal["high", "medium", "low"]

class AnalysisResponse(BaseModel):
    charts: List[ChartConfig]
    global_insight: str
    processing_time_ms: int

class QueryRequest(BaseModel):
    upload_id: str
    question: str
    context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    answer: str
    updated_charts: Optional[List[ChartConfig]] = None
    suggestions: List[str]

class ExportRequest(BaseModel):
    upload_id: str
    format: Literal["pdf", "pptx"]
    options: Optional[Dict[str, Any]] = None

class ExportResponse(BaseModel):
    download_url: str
    expires_at: datetime
    file_size_kb: int
```

---

## 8. 📈 Export Specifications

### 8.1 PDF Export Layout (MVP)

**Page Structure:**
- **Cover Page:**
  - Document title: "Data Insights Report"
  - Dataset name and upload date
  - Global summary (3-4 sentences)
  - Generated timestamp
  - Optional: Sanzoku Labs branding

- **Chart Pages (1 chart per page):**
  - Full-width chart visualization (exported as PNG, 300 DPI)
  - Chart title (H2 style)
  - Insight text below chart (2-3 sentences)
  - Data source reference (filename, date range if applicable)

- **Summary Page:**
  - "Key Findings" section with global insight
  - "Data Overview" section with row/column counts
  - "Methodology" note: "Charts generated using AI-powered analysis"
  - Export metadata (generation date, Hikaru version)

**Styling:**
- Font: Open Sans or system sans-serif
- Colors: Soft blue (#5470c6) for accents
- Margins: 1 inch all sides
- Footer: Page numbers (centered)
- Header: Dataset name (left), date (right)

**Technical Implementation:**
- Use WeasyPrint for HTML → PDF conversion
- Render ECharts to PNG using canvas export
- Jinja2 templates for consistent layout
- Embedded images (no external dependencies)

### 8.2 PPTX Export Layout (Post-MVP)

**Slide Structure:**
- **Slide 1 (Title):**
  - Title: Dataset name
  - Subtitle: Date and record count
  - Background: Soft gradient

- **Slides 2-N (Chart Slides):**
  - Chart image (70% of slide)
  - Title: Chart title
  - Bullet points: Key insights (2-3 bullets)
  - Footer: Slide number

- **Final Slide (Summary):**
  - "Key Takeaways" header
  - Global summary in bullet format
  - "Recommendations" section (if applicable)
  - Contact info placeholder

**Theme:**
- Minimal, modern design
- Customizable brand colors (post-MVP)
- Editable text (not images)

---

## 9. 🔒 Error Handling & Edge Cases

### 9.1 Error Scenarios & UX

| Error Type | Trigger | User Message | Recovery Action | HTTP Status |
|------------|---------|--------------|-----------------|-------------|
| File too large | >10MB upload | "File exceeds 10MB limit. Try filtering data in Excel first." | Suggest smaller dataset | 400 |
| Invalid format | Non-CSV/XLSX | "Unsupported file type. Please upload .csv or .xlsx files." | Show supported formats | 400 |
| Parse failure | Corrupted/malformed | "Unable to read file. Check encoding (UTF-8 recommended) and format." | Link to help docs | 400 |
| Too many rows | >100k rows | "Dataset has {count} rows (limit: 100k). Consider sampling or filtering." | Offer auto-sampling | 400 |
| Too many columns | >50 columns | "Dataset has {count} columns (limit: 50). Select key columns to analyze." | Offer column selection | 400 |
| No numeric data | All categorical | "No numeric columns found for visualization. Data must include measurable values." | Show sample valid file | 422 |
| All null values | Column is empty | "Column '{name}' has no valid data. It will be excluded from analysis." | Warning (non-blocking) | 200 |
| LLM API failure | Anthropic API down | "Insights temporarily unavailable. Charts generated successfully." | Degrade gracefully | 200 |
| LLM timeout | >30s response | "AI analysis taking longer than expected. Showing charts without insights." | Retry button | 200 |
| Export timeout | Complex report | "Export queued. You'll receive a download link shortly." | Background job + notification | 202 |
| Invalid query | Nonsensical question | "I couldn't understand that question. Try asking about specific columns or metrics." | Show example questions | 400 |
| Upload expired | >1 hour old | "Session expired. Please upload your file again." | Redirect to upload | 410 |

### 9.2 Data Validation Rules

**File Upload:**
```python
def validate_upload(file) -> tuple[bool, Optional[str]]:
    # Size check
    if file.size > 10 * 1024 * 1024:  # 10MB
        return False, "File too large"
    
    # Extension check
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        return False, "Invalid file type"
    
    # Content sniff (prevent spoofing)
    magic_bytes = file.read(8)
    file.seek(0)
    if not is_valid_format(magic_bytes):
        return False, "File content doesn't match extension"
    
    return True, None
```

**Schema Validation:**
```python
def validate_schema(df) -> tuple[bool, Optional[str]]:
    # Row count
    if len(df) > 100_000:
        return False, f"Too many rows: {len(df)}"
    
    if len(df) < 2:
        return False, "Insufficient data (minimum 2 rows)"
    
    # Column count
    if len(df.columns) > 50:
        return False, f"Too many columns: {len(df.columns)}"
    
    # Check for at least one numeric column
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) == 0:
        return False, "No numeric columns found"
    
    # Check for excessive null values
    null_pct = df.isnull().sum() / len(df)
    if (null_pct > 0.9).any():
        problematic = null_pct[null_pct > 0.9].index.tolist()
        return False, f"Columns with >90% nulls: {problematic}"
    
    return True, None
```

### 9.3 Graceful Degradation

**Priority Levels:**
1. **Critical (Must Work):** File upload, data preview, chart rendering
2. **High (Degrade Gracefully):** AI insights (show charts without insights)
3. **Medium (Retry/Queue):** Export generation (background jobs)
4. **Low (Optional):** Q&A, advanced features

**Degradation Strategy:**
- If LLM fails: Show charts with generic labels, offer retry
- If chart generation fails: Show data table, offer manual chart selection
- If export fails: Offer screenshot download as fallback
- If DuckDB fails: Fall back to pure Pandas (slower but reliable)

---

## 10. 🎯 Performance Budget & Optimization

### 10.1 Performance Targets (MVP)

| Stage | Target Time | Measurement Point | Optimization Strategy |
|-------|-------------|-------------------|----------------------|
| File upload | < 2s | Upload complete → backend receives | Stream large files, chunk processing |
| Schema detection | < 1s | File parsed → schema ready | Pandas dtype inference, sample-based stats |
| Chart generation | < 3s | Schema ready → chart configs returned | Pre-computed heuristics, parallel generation |
| AI insights (per chart) | < 2s each | Chart data sent → insight received | Parallel API calls (4 concurrent) |
| AI insights (total) | < 8s | All charts → all insights complete | Async processing, caching |
| PDF export | < 5s | Export request → download ready | Pre-rendered templates, image caching |
| **Total (upload to export)** | **< 15s** | File upload → PDF download | End-to-end pipeline optimization |

### 10.2 Optimization Strategies

**Frontend:**
- Code splitting (lazy load chart library)
- Progressive chart rendering (show as they complete)
- Virtualized table for data preview (handle large datasets)
- Debounced Q&A input (avoid excessive API calls)
- Service worker for caching static assets

**Backend:**
- Async FastAPI endpoints (non-blocking I/O)
- Parallel chart generation (ProcessPoolExecutor)
- Parallel LLM calls (asyncio.gather)
- DuckDB for analytical queries (10-100x faster than Pandas)
- Redis cache for insights (optional, post-MVP)

**Data Processing:**
- Sample large datasets for schema detection (first 10k rows)
- Use pandas dtype inference with low_memory=False
- Convert to DuckDB in-memory for complex aggregations
- Lazy evaluation where possible

**AI Optimization:**
- Cache insights by data fingerprint + chart config hash
- Batch API requests when possible
- Use streaming responses for Q&A (better perceived performance)
- Implement request queue to avoid rate limits

### 10.3 Monitoring & Metrics

**Key Metrics to Track:**
- P50, P95, P99 latency for each endpoint
- LLM token usage and cost per analysis
- Chart generation success rate
- Export success rate and time distribution
- Error rates by type
- Cache hit rate (post-MVP)

**Alerting Thresholds:**
- Upload time > 5s (P95)
- Analysis time > 20s (P95)
- Error rate > 5%
- LLM API failure rate > 10%

---

## 11. 🔐 Security, Privacy & Compliance

### 11.1 Data Privacy Policy (MVP)

**Data Lifecycle:**
1. **Upload:** File stored in memory or temp directory
2. **Processing:** Data held in memory for analysis
3. **Retention:** Files deleted after 1 hour or when user closes session
4. **Persistence:** No data stored server-side unless user explicitly saves dashboard (post-MVP)

**Data Security:**
- All API calls over HTTPS (TLS 1.3)
- API keys stored server-side only (never exposed to frontend)
- Environment variables for sensitive config (never committed)
- Input validation on all endpoints (prevent injection attacks)
- File type validation (prevent malicious uploads)
- Rate limiting on API endpoints (prevent abuse)

**Third-Party Data Sharing:**
- Data sent to Anthropic API for AI insights (see note below)
- No data sold or shared with other parties
- No analytics/tracking beyond error monitoring (Sentry, optional)

**Anthropic API Privacy:**
- According to Anthropic's terms, prompts sent via API are not used for training
- Data processed transiently and not retained by Anthropic
- See: https://www.anthropic.com/legal/commercial-terms

### 11.2 Post-MVP Security Enhancements

**User Authentication:**
- Email/password or OAuth (Google, Microsoft)
- JWT tokens for session management
- Role-based access control (viewer, editor, admin)

**Data Isolation:**
- Per-user data encryption at rest
- Tenant isolation for multi-user dashboards
- Audit logs for data access

**Advanced Security:**
- On-premise deployment option for sensitive data
- Self-hosted LLM option (e.g., local Llama model)
- GDPR compliance: data deletion on request
- CCPA compliance: data export on request
- SOC 2 Type II certification (if enterprise)

### 11.3 Compliance Considerations

**GDPR (EU):**
- Right to access: Users can download their data
- Right to deletion: Delete all user data on request
- Data minimization: Only collect necessary data
- Consent: Clear opt-in for data persistence

**CCPA (California):**
- Disclosure of data collection practices
- Right to opt-out of data sale (N/A, no data sold)
- Right to deletion

**HIPAA (if handling health data):**
- Do NOT use Hikaru for PHI without proper BAA
- Recommend anonymization before upload
- Add disclaimer: "Do not upload protected health information"

---

## 12. 📊 Success Metrics & KPIs

### 12.1 Product Metrics

| Category | Metric | Target | Measurement |
|----------|--------|--------|-------------|
| Performance | Time to first insight | < 15s | Upload complete → first chart visible |
| Quality | Chart relevance accuracy | ≥ 80% | User satisfaction survey (post-MVP) |
| Quality | Insight coherence | ≥ 90% | Manual review of 100 random samples |
| Quality | Export success rate | 100% | Successful exports / total attempts |
| Engagement | Charts generated per session | Avg 3.5 | Analytics tracking |
| Engagement | Q&A queries per session | Avg 2.0 | Analytics tracking |
| Retention | Returning users (week) | ≥ 50% | Post-MVP with auth |

### 12.2 Technical Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API uptime | 99.5% | < 99% |
| P95 upload latency | < 3s | > 5s |
| P95 analysis latency | < 10s | > 15s |
| Error rate | < 2% | > 5% |
| LLM API failures | < 5% | > 10% |
| Export generation time | < 5s | > 10s |

### 12.3 Cost Metrics

| Resource | Budget (MVP) | Monitoring |
|----------|--------------|------------|
| LLM API calls | $0.10/analysis | Track token usage |
| Storage | $0.01/GB/month | Monitor file retention |
| Compute | Self-hosted (free) | CPU/memory usage |
| **Total monthly** | ~$50 for 500 analyses | Alerts at $75 |

**Cost Optimization:**
- Cache insights aggressively (reduce LLM calls by 60%)
- Use Claude Sonnet instead of Opus (10x cheaper)
- Implement user-based rate limiting (5 analyses/hour free tier)

---

## 13. 🚀 Development Roadmap

### Phase 1: Foundation (Week 1)
**Goal:** Working file upload + data preview

**Deliverables:**
- Monorepo structure (backend + frontend)
- FastAPI setup with CORS
- React + Vite + Tailwind scaffolding
- File upload component (drag-drop)
- CSV/XLSX parsing with Pandas
- Data preview table (first 10 rows)
- Schema detection (column types, stats)
- Basic error handling

**Success Criteria:**
- Upload 5MB CSV in < 2s
- Preview displays correctly
- Invalid files rejected with clear errors

---

### Phase 2: Chart Generation (Week 2)
**Goal:** Auto-generate charts from data

**Deliverables:**
- Chart generator service (Python)
- Implement chart heuristics (Section 5.1)
- ECharts React wrapper component
- `/api/analyze` endpoint
- Chart grid layout (responsive)
- Chart config generation (ECharts JSON)
- Manual chart refresh button

**Success Criteria:**
- 3-4 relevant charts generated in < 3s
- Charts render correctly in browser
- Different data types trigger different chart types

---

### Phase 3: AI Insights (Week 3)
**Goal:** Generate AI-powered insights

**Deliverables:**
- Anthropic API integration
- AI service layer (prompt templates)
- Per-chart insight generation
- Global summary generation
- Insight display components
- Confidence indicators
- Basic caching (in-memory)
- Retry logic for API failures

**Success Criteria:**
- All charts have insights in < 8s
- 90%+ insights are coherent
- Graceful degradation if API fails

---

### Phase 4: Interactive Q&A (Week 4)
**Goal:** Natural language queries

**Deliverables:**
- Chat interface component
- Query input with examples
- `/api/query` endpoint
- Context management (chart history)
- Dynamic chart updates from Q&A
- Question suggestions
- Streaming responses (optional)

**Success Criteria:**
- Questions answered in < 5s
- Context maintained across 3+ queries
- Relevant chart updates when needed

---

### Phase 5: Export (Week 5)
**Goal:** PDF report generation

**Deliverables:**
- Export service (Python)
- WeasyPrint integration
- Jinja2 templates for report layout
- Chart rendering to PNG
- Export modal UI
- Download link generation
- File cleanup (1-hour expiry)

**Success Criteria:**
- PDF generated in < 5s
- All charts and insights included
- Professional formatting

---

### Phase 6: Polish & Testing (Week 6)
**Goal:** Production-ready MVP

**Deliverables:**
- Full error handling coverage
- Loading states and transitions
- Responsive design (mobile-friendly)
- Accessibility improvements (WCAG 2.1 AA)
- Unit tests (backend)
- Integration tests (E2E)
- Performance optimization
- Documentation (README, API docs)

**Success Criteria:**
- < 2% error rate
- All tests passing
- Meets performance targets (Section 10.1)

---

### Post-MVP Phases (Months 2-3)

**Phase 7: Persistence**
- Dashboard save/load
- SQLite → Postgres migration
- User sessions (cookie-based)

**Phase 8: Authentication**
- User registration/login
- Multi-tenant dashboards
- Access control

**Phase 9: Collaboration**
- Shareable dashboard links
- Comments on charts
- Export scheduling

**Phase 10: Advanced Features**
- PPTX export
- Custom chart design
- Multi-file merge
- Advanced filtering

---

## 14. 🎨 Design & UX Guidelines

### 14.1 Design Principles

- **Minimal Friction:** Upload → insights in 3 clicks
- **Progressive Disclosure:** Show complexity only when needed
- **Confidence Indicators:** Be transparent about AI confidence
- **Actionable Insights:** Every insight should suggest next steps
- **Responsive:** Works on desktop (primary), tablet (secondary)

### 14.2 UI Layout

**Main Screen:**
```
┌─────────────────────────────────────────────────────────┐
│  Hikaru Logo              [Upload New File]  [Export]   │
├─────────────────────────────────────────────────────────┤
│  📊 Sales Data Analysis                                 │
│  ╔═════════════════════════════════════════════════╗    │
│  ║  Global Insight (AI Summary)                    ║    │
│  ║  "Revenue analysis reveals..."                  ║    │
│  ╚═════════════════════════════════════════════════╝    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Chart 1          │  │ Chart 2          │            │
│  │ [Bar Chart]      │  │ [Line Chart]     │            │
│  │ 💡 Insight       │  │ 💡 Insight       │            │
│  └──────────────────┘  └──────────────────┘            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Chart 3          │  │ Chart 4          │            │
│  │ [Scatter]        │  │ [Pie Chart]      │            │
│  │ 💡 Insight       │  │ 💡 Insight       │            │
│  └──────────────────┘  └──────────────────┘            │
├─────────────────────────────────────────────────────────┤
│  💬 Ask a question about your data...                   │
│  [                                              ] [Ask]  │
└─────────────────────────────────────────────────────────┘
```

**Color Palette:**
- Primary: #5470c6 (blue)
- Success: #91cc75 (green)
- Warning: #fac858 (yellow)
- Error: #ee6666 (red)
- Background: #f9fafb (light gray)
- Cards: #ffffff (white)
- Text: #1f2937 (dark gray)

**Typography:**
- Headings: Inter or system-ui, 600 weight
- Body: Inter or system-ui, 400 weight
- Code/Data: JetBrains Mono, 400 weight

### 14.3 shadcn/ui Component Specifications

All UI components are built using **shadcn/ui** primitives for consistency and accessibility.

#### 14.3.1 Core Components Used

| shadcn/ui Component | Usage | Files Needed |
|---------------------|-------|--------------|
| Button | Actions, navigation | `components/ui/button.tsx` |
| Card | Containers for charts, insights | `components/ui/card.tsx` |
| Dialog | Modals for export | `components/ui/dialog.tsx` |
| Input | Text inputs | `components/ui/input.tsx` |
| Label | Form labels | `components/ui/label.tsx` |
| Table | Data preview | `components/ui/table.tsx` |
| Badge | Status indicators | `components/ui/badge.tsx` |
| Alert | Errors, warnings | `components/ui/alert.tsx` |
| Skeleton | Loading states | `components/ui/skeleton.tsx` |
| Progress | Upload progress | `components/ui/progress.tsx` |
| Textarea | Multi-line input | `components/ui/textarea.tsx` |
| Select | Dropdowns | `components/ui/select.tsx` |
| Tooltip | Help text | `components/ui/tooltip.tsx` |
| Separator | Dividers | `components/ui/separator.tsx` |
| ScrollArea | Scrollable content | `components/ui/scroll-area.tsx` |

**Installation command:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input label table badge alert skeleton progress textarea select tooltip separator scroll-area
```

#### 14.3.2 Custom Component Implementations

**FileUploader Component:**
```tsx
// components/FileUploader.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X, AlertCircle } from "lucide-react"

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>
  maxSizeMB?: number
  acceptedFormats?: string[]
}

// Features:
// - Drag-drop zone with dashed border (border-dashed)
// - Click to browse alternative (hidden input)
// - File validation (size, type) with Alert for errors
// - Upload progress bar using Progress component
// - File preview with Card component
// - Remove button with X icon
```

**DataPreview Component:**
```tsx
// components/DataPreview.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DataPreviewProps {
  schema: DataSchema
  onAnalyze: () => void
}

// Features:
// - Table headers with type badges (Badge component)
// - ScrollArea for horizontal scrolling (many columns)
// - First 10 rows visible
// - Row/column count in CardDescription
// - "Analyze Data" Button (variant="default")
```

**ChartCard Component:**
```tsx
// components/ChartCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReactECharts from 'echarts-for-react'
import { Lightbulb } from "lucide-react"

interface ChartCardProps {
  chart: ChartConfig
  isLoading?: boolean
}

// Features:
// - Card with hover effect (hover:shadow-lg transition)
// - ECharts rendering in CardContent
// - Loading skeleton while chart generates
// - Insight in Alert component (variant="default" with blue bg)
// - Confidence badge (destructive/warning/default for low/medium/high)
// - Lightbulb icon for insights
```

**GlobalInsightCard Component:**
```tsx
// components/GlobalInsightCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface GlobalInsightCardProps {
  insight: string
  isLoading?: boolean
}

// Features:
// - Card with primary border (border-primary/20)
// - Primary background tint (bg-primary/5)
// - Sparkles icon in header
// - Large, readable text
// - Positioned at top of dashboard
```

**QueryInput Component:**
```tsx
// components/QueryInput.tsx
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2 } from "lucide-react"

interface QueryInputProps {
  onSubmit: (question: string) => Promise<void>
  isLoading?: boolean
  suggestions?: string[]
}

// Features:
// - Textarea with auto-resize
// - Submit on Enter (Shift+Enter for new line)
// - Suggestion badges on focus (Badge with onClick)
// - Loading state (Button with Loader2 icon)
// - Previous questions (optional scrollable list)
```

**ExportModal Component:**
```tsx
// components/ExportModal.tsx
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Download, FileText } from "lucide-react"

interface ExportModalProps {
  onExport: (format: 'pdf' | 'pptx', options: ExportOptions) => Promise<void>
}

// Features:
// - Dialog component for modal
// - Format selection (Select - PDF only for MVP)
// - Chart selection checkboxes (optional)
// - Export progress (Progress component)
// - Download button appears on completion
// - Success/error states with Alert
```

#### 14.3.3 Layout Components

**App Shell:**
```tsx
// App.tsx or Layout.tsx
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hikaru</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload New
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground text-center">
          Powered by Sanzoku Labs
        </div>
      </footer>
    </div>
  )
}
```

**Dashboard Grid:**
```tsx
// components/Dashboard.tsx
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function Dashboard({ data, charts, globalInsight }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Global Insight */}
      <GlobalInsightCard insight={globalInsight} />
      
      <Separator />
      
      {/* Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charts.map(chart => (
          <ChartCard key={chart.chart_id} chart={chart} />
        ))}
      </div>
      
      <Separator />
      
      {/* Q&A Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ask Questions</CardTitle>
          <CardDescription>
            Ask about trends, comparisons, or specific values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueryInput onSubmit={handleQuery} />
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 14.3.4 Theme Configuration

**tailwind.config.js** with Hikaru brand colors:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(220, 70%, 60%)", // #5470c6
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other shadcn/ui colors
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**globals.css** (shadcn/ui theme variables):
```css
@layer base {
  :root {
    --background: 210 20% 98%; /* #f9fafb */
    --foreground: 222 47% 11%; /* #1f2937 */
    --primary: 220 70% 60%; /* #5470c6 */
    --primary-foreground: 210 40% 98%;
    --card: 0 0% 100%; /* white */
    --card-foreground: 222 47% 11%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 220 70% 60%;
    /* ... additional variables */
  }
}
```

#### 14.3.5 Responsive Design

**Breakpoints (Tailwind defaults):**
- Mobile: < 640px (1 column)
- Tablet: 640px - 1023px (2 columns)
- Desktop: ≥ 1024px (2 columns, potentially 3 for XL)

**Grid Behavior:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
  {/* Charts */}
</div>
```

**Mobile Optimizations:**
- Sticky header: `className="sticky top-0 z-50 bg-background/95 backdrop-blur"`
- Touch-friendly buttons: Default shadcn/ui buttons already meet 44px minimum
- Collapsible sections: Use shadcn/ui Collapsible component
- Reduced margins: `className="px-4 md:px-8"`

#### 14.3.6 Loading States

**Chart Loading:**
```tsx
{isLoading ? (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-[200px]" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-4 w-full mt-4" />
      <Skeleton className="h-4 w-[80%]" />
    </CardContent>
  </Card>
) : (
  <ChartCard chart={chart} />
)}
```

**Global Loading:**
```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### 14.4 Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- Color contrast ≥ 4.5:1 for text
- All interactive elements keyboard accessible
- Focus indicators on all controls
- ARIA labels for chart visuals
- Alt text for exported chart images
- Screen reader announcements for dynamic content

**Keyboard Navigation:**
- Tab: Move between interactive elements
- Enter: Activate buttons, submit queries
- Escape: Close modals
- Arrow keys: Navigate chart series (optional)

---

## 15. 🧪 Testing Strategy & Quality Assurance

### 15.1 Test Data Sets

Include in `sample-data/` directory:

1. **sales_by_region.csv**
   - Columns: region (categorical), revenue (numeric), units_sold (numeric), quarter (categorical)
   - Rows: 24 (4 regions × 6 quarters)
   - Tests: Bar charts, grouped bars, categorical analysis

2. **monthly_revenue.csv**
   - Columns: month (datetime), revenue (numeric), expenses (numeric), profit (numeric)
   - Rows: 24 (2 years monthly)
   - Tests: Line charts, time series, multi-line, correlation

3. **customer_segments.csv**
   - Columns: age (numeric), income (numeric), segment (categorical), purchases (numeric)
   - Rows: 500
   - Tests: Scatter plots, correlations, distributions, histograms

4. **messy_data.csv**
   - Mixed data types, missing values (20%), outliers, special characters
   - Rows: 100
   - Tests: Error handling, data cleaning, edge cases

5. **large_dataset.csv**
   - Multiple columns (30), 50,000 rows
   - Tests: Performance, memory usage, sampling

6. **minimal_data.csv**
   - 2 rows, 2 columns
   - Tests: Minimum viable dataset handling

7. **edge_cases.csv**
   - Single numeric column, all nulls in one column, duplicate rows, extreme outliers
   - Tests: Edge case handling

### 15.2 Testing Levels

**Unit Tests (Pytest):**
- Data processor functions (schema detection, type inference)
- Chart generator logic (heuristics, config generation)
- AI service prompt formatting
- Export service template rendering
- Validation functions

**Integration Tests:**
- Full upload → analyze flow
- API endpoint contracts
- Database operations (post-MVP)
- LLM API integration (mocked)

**E2E Tests (Playwright or Cypress):**
- Upload file → view charts → export PDF
- Q&A interaction flow
- Error scenarios (invalid files, API failures)

**Performance Tests:**
- Load testing (100 concurrent uploads)
- Large file handling (10MB)
- Chart generation speed (benchmark against targets)

### 15.3 Quality Gates

**Before Merge:**
- All unit tests pass
- Code coverage ≥ 80%
- Linting passes (pylint, eslint)
- Type checking passes (mypy, TypeScript)
- No high-severity security warnings

**Before Release:**
- All E2E tests pass
- Performance targets met (Section 10.1)
- Manual QA checklist complete
- Accessibility audit passes
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 16. 🔮 Future Vision & Extensibility

### 16.1 Long-Term Vision

Hikaru evolves from a **standalone tool** into a **BI co-pilot** that:

1. **Teaches Users About Their Data**
   - Explains statistical concepts in plain language
   - Suggests analysis techniques based on data patterns
   - Provides data literacy tips and best practices

2. **Predictive Analytics**
   - Forecast trends using simple ML models
   - Anomaly detection with explanations
   - "What-if" scenario modeling

3. **Collaborative Intelligence**
   - Team dashboards with shared insights
   - Comment threads on charts
   - Insight voting and curation

4. **Integration Hub**
   - Plugin for Ascendia (Sanzoku Labs project)
   - Embeddable widget for other apps
   - API for programmatic access

### 16.2 Integration Opportunities

**As a Sanzoku Labs Module:**
- **Ascendia:** Analytics dashboard for user metrics
- **Sanzen:** Financial reporting and visualization
- **Future Apps:** Drop-in data analysis component

**Technical Architecture for Integration:**
```typescript
// React Component
import { HikaruDataBoard } from '@sanzoku/hikaru'

<HikaruDataBoard
  data={csvData}
  apiKey={process.env.HIKARU_API_KEY}
  theme="light"
  onInsightGenerated={(insights) => console.log(insights)}
/>
```

```python
# Python API
from hikaru import analyze_data

results = analyze_data(
    file_path="data.csv",
    user_prompt="Compare regional sales",
    export_format="pdf"
)
```

### 16.3 Technology Evolution

**Near-Term (6-12 months):**
- Upgrade to DuckDB WASM for client-side analytics
- Add support for Google Sheets, Airtable APIs
- Implement real-time data streaming
- Multi-language support (French, Spanish)

**Long-Term (12-24 months):**
- Self-hosted LLM option (privacy-focused)
- Custom ML model training on user data
- Mobile app (React Native)
- Desktop app (Electron) for offline use
- Enterprise features (SSO, audit logs, white-labeling)

---

## 17. 📁 Projects & Multi-File Architecture (Post-MVP)

### 17.1 Feature Overview

**Problem:**
Users often work with multiple related datasets:
- Monthly sales reports across quarters
- Different regional data files
- Related datasets (customers + orders + products)
- Comparative analysis (2024 vs 2025 data)

**Solution:**
Introduce **Projects** (or Workspaces) that group multiple file uploads together, enabling:
- Organized file management
- Cross-file analysis and comparisons
- Shared context for AI insights
- Persistent work sessions

### 17.2 User Stories

**As a business analyst, I want to:**
- Upload multiple months of sales data and compare trends across periods
- Group all Q4 reports in one project for quarterly review
- Analyze correlations between customer data and order history
- Return to my "2024 Sales Analysis" project days later with all context preserved

**As a data scientist, I want to:**
- Compare production data vs staging data side-by-side
- Merge customer segments with transaction data for insights
- Keep training, validation, and test datasets organized
- Share my project workspace with team members

### 17.3 Core Concepts

#### Project Structure
```
Project: "Q4 2024 Sales Analysis"
├── Files
│   ├── october_sales.csv (uploaded Nov 1)
│   ├── november_sales.csv (uploaded Dec 1)
│   └── december_sales.csv (uploaded Jan 2)
├── Dashboards
│   ├── October Dashboard (4 charts)
│   ├── November Dashboard (4 charts)
│   └── Combined Q4 Dashboard (6 charts)
├── Insights
│   ├── Per-file insights
│   └── Cross-file insights
└── Metadata
    ├── Created: Nov 1, 2024
    ├── Last accessed: Jan 5, 2025
    └── Owner: user@company.com
```

#### File Relationships
Users can define relationships between files:
- **Independent:** Files analyzed separately (default)
- **Comparison:** Files compared side-by-side (e.g., "Q3 vs Q4")
- **Merge:** Files joined on common columns (e.g., customers + orders)
- **Hierarchical:** Files represent drill-down levels (country → region → city)

### 17.4 Data Model

#### Database Schema (Postgres)

```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);

-- Files table (extends current upload concept)
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT NOW(),
    schema_json JSONB NOT NULL,  -- Stores DataSchema
    row_count INTEGER NOT NULL,
    column_count INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Dashboards table
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,  -- NULL for cross-file dashboards
    name VARCHAR(255) NOT NULL,
    charts_json JSONB NOT NULL,  -- Array of ChartConfig
    global_insight TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- File relationships (for cross-file analysis)
CREATE TABLE file_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_id_a UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_id_b UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,  -- 'comparison', 'merge', 'hierarchical'
    join_config JSONB,  -- For merge relationships: { "left_key": "customer_id", "right_key": "customer_id" }
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(file_id_a, file_id_b, relationship_type)
);

-- Project members (for collaboration - Phase 8)
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- 'owner', 'editor', 'viewer'
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_dashboards_project_id ON dashboards(project_id);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_last_accessed ON projects(last_accessed_at DESC);
```

#### Pydantic Models (Backend)

```python
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    created_at: datetime
    updated_at: datetime
    last_accessed_at: datetime
    file_count: int
    dashboard_count: int
    is_archived: bool = False

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class FileInProject(BaseModel):
    id: str
    project_id: str
    filename: str
    file_size_mb: float
    upload_timestamp: datetime
    row_count: int
    column_count: int
    schema: DataSchema

class FileRelationship(BaseModel):
    id: str
    file_id_a: str
    file_id_b: str
    relationship_type: Literal["comparison", "merge", "hierarchical"]
    join_config: Optional[dict] = None

class DashboardInProject(BaseModel):
    id: str
    name: str
    file_id: Optional[str]  # NULL for cross-file dashboards
    chart_count: int
    created_at: datetime
    updated_at: datetime
    thumbnail_url: Optional[str] = None

class ProjectDetail(BaseModel):
    project: Project
    files: List[FileInProject]
    dashboards: List[DashboardInProject]
    relationships: List[FileRelationship]
```

### 17.5 API Endpoints

#### Project Management

```python
# Create new project
POST /api/projects
Request: { "name": "Q4 2024 Analysis", "description": "..." }
Response: Project

# List all projects
GET /api/projects?archived=false&sort=last_accessed
Response: { "projects": [Project] }

# Get project details
GET /api/projects/{project_id}
Response: ProjectDetail

# Update project
PATCH /api/projects/{project_id}
Request: { "name": "New Name" }
Response: Project

# Archive/delete project
DELETE /api/projects/{project_id}
Response: { "success": true }
```

#### File Management in Projects

```python
# Upload file to project
POST /api/projects/{project_id}/files
Request: multipart/form-data with file
Response: FileInProject

# List files in project
GET /api/projects/{project_id}/files
Response: { "files": [FileInProject] }

# Delete file from project
DELETE /api/projects/{project_id}/files/{file_id}
Response: { "success": true }

# Define file relationship
POST /api/projects/{project_id}/relationships
Request: {
  "file_id_a": "uuid",
  "file_id_b": "uuid",
  "relationship_type": "merge",
  "join_config": { "left_key": "customer_id", "right_key": "id" }
}
Response: FileRelationship
```

#### Cross-File Analysis

```python
# Analyze single file (existing)
POST /api/projects/{project_id}/files/{file_id}/analyze
Response: AnalysisResponse

# Compare two files
POST /api/projects/{project_id}/compare
Request: {
  "file_id_a": "uuid",
  "file_id_b": "uuid",
  "comparison_type": "trend" | "difference" | "correlation"
}
Response: {
  "charts": [ChartConfig],  # Comparison charts
  "insights": string  # AI-generated comparison insights
}

# Merge and analyze files
POST /api/projects/{project_id}/merge-analyze
Request: {
  "relationship_id": "uuid"
}
Response: AnalysisResponse  # Charts from merged dataset
```

### 17.6 UI/UX Design

#### Project Dashboard (New Home Screen)

```
┌─────────────────────────────────────────────────────────────┐
│  Hikaru                    [New Project]  [User Menu]        │
├─────────────────────────────────────────────────────────────┤
│  My Projects                                  🔍 Search       │
│                                                               │
│  ┌──────────────────────────────────────┐                   │
│  │  📁 Q4 2024 Sales Analysis            │                   │
│  │  3 files • 5 dashboards               │                   │
│  │  Last accessed: 2 hours ago           │                   │
│  │  [Open]                               │                   │
│  └──────────────────────────────────────┘                   │
│                                                               │
│  ┌──────────────────────────────────────┐                   │
│  │  📁 Customer Segmentation             │                   │
│  │  2 files • 2 dashboards               │                   │
│  │  Last accessed: 3 days ago            │                   │
│  │  [Open]                               │                   │
│  └──────────────────────────────────────┘                   │
│                                                               │
│  [+ Create New Project]                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Inside a Project

```
┌─────────────────────────────────────────────────────────────┐
│  ← Projects  /  Q4 2024 Sales Analysis                       │
│  [Upload File]  [Compare Files]  [Settings]                  │
├─────────────────────────────────────────────────────────────┤
│  📂 Files (3)                              📊 Dashboards (5) │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ october_sales     │  │ november_sales   │                │
│  │ 1,234 rows       │  │ 1,456 rows       │                │
│  │ [Analyze]        │  │ [Analyze]        │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  🔗 Relationships:                                           │
│  october_sales ⟷ november_sales (Comparison)               │
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 │
│                                                               │
│  Recent Dashboards:                                          │
│  • October Dashboard (4 charts)                              │
│  • October vs November Comparison (6 charts)                 │
│  • Q4 Summary (8 charts)                                     │
└─────────────────────────────────────────────────────────────┘
```

#### File Comparison Flow

```
1. User clicks "Compare Files" button
2. Modal appears: "Select files to compare"
   - Checkboxes for each file in project
   - Select comparison type:
     □ Trend Comparison (time series data)
     □ Side-by-Side Metrics (same schema)
     □ Year-over-Year Analysis
3. User selects files and comparison type
4. AI generates comparison dashboard with:
   - Overlayed charts (e.g., two line charts on same axis)
   - Difference charts (delta between datasets)
   - Insights like "Revenue increased 15% from Oct to Nov"
```

### 17.7 Implementation Phases

#### Phase 7A: Basic Projects (Week 7-8)
**Goal:** Users can create projects and upload multiple files

**Deliverables:**
- Projects CRUD API endpoints
- Project list UI (shadcn/ui Cards)
- File management within projects
- Update upload flow to require project selection
- Database schema implementation
- Migration from MVP (create "Default Project" for existing uploads)

**Success Criteria:**
- Create project in < 2 clicks
- Upload multiple files to a project
- Navigate between projects smoothly
- All existing functionality works within project context

#### Phase 7B: File Comparison (Week 9)
**Goal:** Compare two files side-by-side

**Deliverables:**
- File comparison UI
- Comparison chart generator (overlay charts)
- AI prompts for comparison insights
- Comparison dashboard persistence

**Success Criteria:**
- Compare 2 files with same schema
- AI generates "A vs B" insights
- Export comparison dashboard

#### Phase 7C: File Merging (Week 10)
**Goal:** Join files on common keys

**Deliverables:**
- Relationship configuration UI
- Join logic (pandas merge)
- Merged dataset analysis
- Cross-file insights

**Success Criteria:**
- Define merge relationship (e.g., customers + orders)
- Generate charts from merged data
- AI insights span both datasets

### 17.8 Cross-File AI Insights

#### Enhanced Prompts for Multi-File Context

**Comparison Insight Prompt:**
```
You are comparing two related datasets for trend analysis.

DATASET A: {filename_a}
- Time period: {time_range_a}
- Key metrics: {metrics_a}

DATASET B: {filename_b}
- Time period: {time_range_b}
- Key metrics: {metrics_b}

COMPARISON RESULTS:
{comparison_data}

TASK:
Provide a 3-4 sentence comparison insight that:
1. Identifies the most significant change between datasets
2. Quantifies the change with percentages or absolute values
3. Suggests potential reasons for the change
4. Recommends a follow-up action

Example:
"Revenue increased 23% from October to November, rising from $125K to $154K. This growth was primarily driven by a 31% spike in the East region, while other regions remained flat. The timing coincides with the Q4 product launch. Consider investigating which specific products drove East region growth to replicate success elsewhere."
```

**Merged Dataset Insight Prompt:**
```
You are analyzing a merged dataset combining customer and order information.

MERGED DATA CONTEXT:
- Source A: {source_a_name} ({row_count_a} customers)
- Source B: {source_b_name} ({row_count_b} orders)
- Join key: {join_key}
- Merged result: {merged_row_count} records

KEY FINDINGS FROM MERGED DATA:
{merged_analysis}

TASK:
Provide insights that leverage the combination of both datasets:
1. Customer behavior patterns revealed by order history
2. Segment-specific trends
3. Opportunities for targeted actions

Focus on insights that wouldn't be possible from either dataset alone.
```

### 17.9 Migration Strategy (MVP to Projects)

When adding Projects to existing Hikaru deployments:

**Option 1: Automatic Migration (Recommended)**
```python
# Migration script
def migrate_uploads_to_projects():
    """Create a default project for each user and move their uploads"""
    
    for user in get_all_users():
        # Create "My Analyses" default project
        default_project = create_project(
            owner_id=user.id,
            name=f"{user.name}'s Analyses",
            description="Auto-created during system upgrade"
        )
        
        # Move all standalone uploads to default project
        standalone_uploads = get_standalone_uploads(user.id)
        for upload in standalone_uploads:
            move_upload_to_project(upload.id, default_project.id)
```

**Option 2: Gradual Migration**
- Keep standalone uploads supported (backwards compatible)
- Show prompt: "Organize your files in Projects?"
- Allow users to create projects manually
- Eventually deprecate standalone uploads

**Recommended:** Option 1 for simplicity. Create a "Default Project" for all existing data.

### 17.10 Storage Considerations

**File Storage:**
- MVP: `/uploads/{upload_id}.csv`
- Projects: `/uploads/{project_id}/{file_id}.csv`

**Benefits:**
- Easy cleanup (delete entire project folder)
- Better organization
- Faster retrieval (group related files)

**Disk Usage Estimates:**
- Average project: 3-5 files × 5MB = 15-25MB
- 100 active projects = 1.5-2.5GB
- With 7-day retention: Manageable on single server
- Scale up: Move to S3/R2 when needed

### 17.11 Performance Optimizations

**Caching Strategy:**
```python
# Cache project metadata in Redis
cache_key = f"project:{project_id}:metadata"
ttl = 1800  # 30 minutes

# Cache file schemas (these don't change)
cache_key = f"file:{file_id}:schema"
ttl = 86400  # 24 hours

# Invalidate on updates
def update_project(project_id, updates):
    # Update DB
    db.update_project(project_id, updates)
    # Clear cache
    cache.delete(f"project:{project_id}:metadata")
```

**Query Optimizations:**
```sql
-- Precompute file counts
SELECT p.*, COUNT(f.id) as file_count
FROM projects p
LEFT JOIN files f ON f.project_id = p.id
WHERE p.owner_id = ?
GROUP BY p.id
ORDER BY p.last_accessed_at DESC;

-- Use materialized views for dashboard
CREATE MATERIALIZED VIEW project_stats AS
SELECT 
    project_id,
    COUNT(DISTINCT file_id) as file_count,
    COUNT(DISTINCT dashboard_id) as dashboard_count,
    SUM(file_size_bytes) as total_size_bytes
FROM files f
LEFT JOIN dashboards d ON d.project_id = f.project_id
GROUP BY project_id;
```

### 17.12 Future Enhancements (Post Phase 7)

**Advanced Project Features:**
- **Project templates:** Pre-configured projects for common use cases
  - "Monthly Sales Analysis" with expected file structure
  - "Customer Segmentation" with merge relationships pre-defined
- **Project versioning:** Snapshot projects at key milestones
- **Project cloning:** Duplicate project structure for new period
- **Scheduled data refresh:** Auto-update files from connected sources
- **Project export:** Download entire project as zip (all files + dashboards)
- **Project sharing:** Share read-only projects via public link

**Enterprise Features:**
- **Folder hierarchy:** Projects nested in folders
- **Access control:** Fine-grained permissions per project
- **Audit logs:** Track all project activities
- **Data lineage:** Visualize file relationships and transformations
- **Cost tracking:** Monitor storage and compute costs per project

---

## 18. 📚 References & Resources

### 17.1 Technical Documentation

- **FastAPI:** https://fastapi.tiangolo.com/
- **Pandas:** https://pandas.pydata.org/docs/
- **DuckDB:** https://duckdb.org/docs/
- **ECharts:** https://echarts.apache.org/en/index.html
- **Anthropic API:** https://docs.anthropic.com/
- **WeasyPrint:** https://doc.courtbouillon.org/weasyprint/

### 17.2 Design Inspiration

- **Observable:** https://observablehq.com/
- **Notion:** https://www.notion.so/
- **Google Data Studio:** https://datastudio.google.com/
- **Tableau Public:** https://public.tableau.com/

### 17.3 Similar Products (Competitive Analysis)

- **ChatCSV:** AI-powered CSV analysis (competitor)
- **Julius AI:** Data analysis chatbot (competitor)
- **Columns.ai:** AI data storytelling (inspiration)
- **Hex:** Collaborative notebooks (different niche)

---

## 19. 📝 Appendix

### 18.1 Glossary

- **BI:** Business Intelligence
- **ECharts:** Open-source JavaScript visualization library
- **DuckDB:** Embeddable SQL OLAP database
- **Heuristic:** Rule-based approach for chart selection
- **LLM:** Large Language Model (e.g., Claude, GPT)
- **OLAP:** Online Analytical Processing
- **Pydantic:** Python data validation library
- **Schema:** Structure of data (column names, types)

### 18.2 Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v1.0 | Nov 2025 | Initial PRD draft | Yuzhou |
| v1.1 | Nov 2025 | Refined with detailed specs, API docs, error handling | Yuzhou + Claude |

### 18.3 Open Questions

1. Should we support SQL databases as data sources (post-MVP)?
2. What's the best approach for handling very large files (>100MB)?
3. Should we build a desktop app for offline use?
4. How to monetize: Freemium, usage-based, or one-time purchase?
5. Should we open-source the core engine?

### 18.4 Feedback & Contributions

**Internal Review:** Sanzoku Labs team
**External Beta:** TBD (planned for Q1 2026)
**Contact:** [Your email or project contact]

---

## 🎯 Next Steps

1. **Review & Approve PRD** ✅ (You are here)
2. **Set Up Development Environment**
   - Install Python 3.11+, Node.js 18+
   - Create GitHub repository
   - Set up project structure

3. **Begin Phase 1 Development**
   - Scaffold backend (FastAPI)
   - Scaffold frontend (React + Vite)
   - Implement file upload

4. **Weekly Check-ins**
   - Review progress against roadmap
   - Adjust timeline as needed
   - Demo working features

**Ready to build? Let's ship this! 🚀**
