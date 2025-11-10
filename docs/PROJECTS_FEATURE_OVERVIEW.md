# Hikaru Projects Feature - Architecture Overview

## 📋 Executive Summary

The **Projects** feature (Phase 7, post-MVP) enables users to organize multiple related file uploads into workspaces, enabling cross-file analysis, comparisons, and persistent work sessions.

---

## 🎯 Problem Statement

**Current MVP Limitation:**
- Users can only analyze one file at a time
- No way to organize related datasets
- No persistent context when returning to work
- Can't compare or merge multiple datasets

**Real-World Scenarios:**
- Comparing monthly sales reports (Jan, Feb, Mar...)
- Analyzing customer data + order data together
- Regional comparison (North.csv, South.csv, East.csv...)
- Year-over-year analysis (2024.csv vs 2025.csv)

---

## 🏗️ Conceptual Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          HIKARU                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PROJECT: Q4 2024 Sales Analysis                     │  │
│  │  Created: Nov 1, 2024 • Owner: analyst@company.com  │  │
│  │                                                       │  │
│  │  FILES (3)                                           │  │
│  │  ├─ october_sales.csv (1,234 rows)                  │  │
│  │  ├─ november_sales.csv (1,456 rows)                 │  │
│  │  └─ december_sales.csv (1,389 rows)                 │  │
│  │                                                       │  │
│  │  DASHBOARDS (5)                                      │  │
│  │  ├─ October Analysis (4 charts)                     │  │
│  │  ├─ November Analysis (4 charts)                    │  │
│  │  ├─ October vs November Comparison (6 charts)       │  │
│  │  ├─ Q4 Trends (8 charts)                            │  │
│  │  └─ Year-over-Year Q4 (5 charts)                    │  │
│  │                                                       │  │
│  │  RELATIONSHIPS                                       │  │
│  │  └─ october_sales ⟷ november_sales (Comparison)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PROJECT: Customer Segmentation                      │  │
│  │  Created: Oct 15, 2024 • Owner: analyst@company.com │  │
│  │                                                       │  │
│  │  FILES (2)                                           │  │
│  │  ├─ customers.csv (5,432 rows)                      │  │
│  │  └─ orders.csv (12,890 rows)                        │  │
│  │                                                       │  │
│  │  RELATIONSHIPS                                       │  │
│  │  └─ customers ⟷ orders (Merge on customer_id)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Model

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   USERS     │         │  PROJECTS   │         │    FILES    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id          │──┐      │ id          │──┐      │ id          │
│ email       │  │      │ name        │  │      │ project_id  │──┐
│ name        │  │      │ description │  │      │ filename    │  │
│ created_at  │  │      │ owner_id    │◄─┘      │ file_path   │  │
└─────────────┘  │      │ created_at  │         │ schema_json │  │
                 │      │ updated_at  │         │ row_count   │  │
                 │      └─────────────┘         └─────────────┘  │
                 │             │                        │         │
                 │             │                        │         │
                 │      ┌──────┴────────┐              │         │
                 │      │               │              │         │
                 │      ▼               ▼              │         │
                 │ ┌─────────────┐ ┌─────────────┐    │         │
                 │ │ DASHBOARDS  │ │FILE_RELATION│    │         │
                 │ ├─────────────┤ ├─────────────┤    │         │
                 │ │ id          │ │ id          │    │         │
                 │ │ project_id  │ │ project_id  │    │         │
                 │ │ file_id     │ │ file_id_a   │◄───┘         │
                 │ │ name        │ │ file_id_b   │◄─────────────┘
                 │ │ charts_json │ │ type        │
                 │ │ created_at  │ │ join_config │
                 │ └─────────────┘ └─────────────┘
                 │
                 │ ┌──────────────────┐
                 └►│ PROJECT_MEMBERS  │
                   ├──────────────────┤
                   │ id               │
                   │ project_id       │
                   │ user_id          │
                   │ role (owner/etc) │
                   └──────────────────┘
```

### Database Schema (Simplified)

```sql
-- Core tables
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP,
    last_accessed_at TIMESTAMP
);

CREATE TABLE files (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    filename VARCHAR(255),
    schema_json JSONB,  -- Stores column info
    row_count INTEGER
);

CREATE TABLE dashboards (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    file_id UUID REFERENCES files(id),  -- NULL for cross-file dashboards
    charts_json JSONB  -- Array of charts
);

CREATE TABLE file_relationships (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    file_id_a UUID REFERENCES files(id),
    file_id_b UUID REFERENCES files(id),
    relationship_type VARCHAR(50),  -- 'comparison', 'merge', 'hierarchical'
    join_config JSONB  -- For merges: { "left_key": "id", "right_key": "customer_id" }
);
```

---

## 🔄 User Flows

### Flow 1: Create Project & Upload Files

```
User Journey:
1. Click "New Project"
2. Enter name: "Q4 Sales Analysis"
3. Upload october_sales.csv → Auto-analyzed → Dashboard created
4. Upload november_sales.csv → Auto-analyzed → Dashboard created
5. Click "Compare Files" → Select both → AI generates comparison
6. Export combined Q4 report

Backend Flow:
┌────────┐    POST /api/projects     ┌────────────┐
│ Client │ ───────────────────────► │   Backend  │
└────────┘                           └─────┬──────┘
                                           │
                                           ▼
                                    Create project in DB
                                    Return project_id
                                           │
┌────────┐  POST /api/projects/{id}/files ▼
│ Client │ ───────────────────────► ┌────────────┐
└────────┘                           │   Backend  │
                                     └─────┬──────┘
                                           │
                                           ▼
                                    Save file to:
                                    /uploads/{project_id}/{file_id}.csv
                                           │
                                           ▼
                                    Analyze with Pandas
                                    Generate dashboard
                                    Store in DB
                                           │
                                           ▼
                                    Return UploadResponse
```

### Flow 2: Compare Two Files

```
User Journey:
1. Inside project, click "Compare Files"
2. Select: october_sales.csv + november_sales.csv
3. Choose comparison type: "Trend Comparison"
4. AI generates overlay charts showing both months
5. AI insight: "Revenue increased 15% from Oct to Nov"

Backend Flow:
POST /api/projects/{id}/compare
{
  "file_id_a": "october-uuid",
  "file_id_b": "november-uuid",
  "comparison_type": "trend"
}
         │
         ▼
Load both DataFrames from storage
         │
         ▼
Generate comparison charts:
- Overlay line chart (both series)
- Delta bar chart (differences)
- Correlation scatter (if applicable)
         │
         ▼
Send to Claude API with special prompt:
"Compare these two datasets... identify biggest change..."
         │
         ▼
Return ComparisonResponse:
{
  "charts": [overlayed_charts],
  "insights": "Revenue increased 15%...",
  "dashboard_id": "comparison-uuid"
}
```

### Flow 3: Merge Files on Common Key

```
User Journey:
1. Upload customers.csv (columns: id, name, segment)
2. Upload orders.csv (columns: order_id, customer_id, revenue)
3. Click "Define Relationship"
4. Select: customers ⟷ orders
5. Type: "Merge"
6. Left key: "id", Right key: "customer_id"
7. Click "Analyze Merged Data"
8. AI generates charts from joined dataset

Backend Flow:
POST /api/projects/{id}/relationships
{
  "file_id_a": "customers-uuid",
  "file_id_b": "orders-uuid",
  "relationship_type": "merge",
  "join_config": {
    "left_key": "id",
    "right_key": "customer_id",
    "how": "inner"  // inner, left, right, outer
  }
}
         │
         ▼
Store relationship in DB
         │
         ▼
POST /api/projects/{id}/merge-analyze
{
  "relationship_id": "rel-uuid"
}
         │
         ▼
Load both DataFrames
         │
         ▼
Execute pandas merge:
df_merged = pd.merge(
    df_customers,
    df_orders,
    left_on='id',
    right_on='customer_id',
    how='inner'
)
         │
         ▼
Analyze merged DataFrame
Generate charts showing:
- Revenue by customer segment
- Top customers by order count
- Segment-level trends
         │
         ▼
Send to Claude with context:
"Analyzing merged customer + order data..."
         │
         ▼
Return MergedAnalysisResponse
```

---

## 🎨 UI Components (shadcn/ui)

### Project List Screen

```tsx
// components/ProjectList.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, Plus, Clock } from "lucide-react"

interface Project {
  id: string
  name: string
  description?: string
  file_count: number
  dashboard_count: number
  last_accessed_at: string
}

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">My Projects</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <Card key={project.id} className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <div className="flex items-start gap-3">
                <FolderOpen className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.file_count} files • {project.dashboard_count} dashboards
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                Last accessed {formatRelative(project.last_accessed_at)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Project Detail Screen

```tsx
// components/ProjectDetail.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, GitCompare, Settings } from "lucide-react"

export function ProjectDetail({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <Button variant="outline">
            <GitCompare className="mr-2 h-4 w-4" />
            Compare Files
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files">Files ({project.files.length})</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards ({project.dashboards.length})</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <FileGrid files={project.files} />
        </TabsContent>

        <TabsContent value="dashboards">
          <DashboardGrid dashboards={project.dashboards} />
        </TabsContent>

        <TabsContent value="relationships">
          <RelationshipList relationships={project.relationships} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### File Comparison Modal

```tsx
// components/ComparisonModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function ComparisonModal({ files, open, onClose }: ComparisonModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [comparisonType, setComparisonType] = useState<string>('trend')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compare Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select files to compare (2 or more)
            </label>
            {files.map(file => (
              <div key={file.id} className="flex items-center space-x-2 py-2">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFiles([...selectedFiles, file.id])
                    } else {
                      setSelectedFiles(selectedFiles.filter(id => id !== file.id))
                    }
                  }}
                />
                <label>{file.filename}</label>
              </div>
            ))}
          </div>

          {/* Comparison type */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comparison Type
            </label>
            <Select value={comparisonType} onValueChange={setComparisonType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trend">Trend Comparison</SelectItem>
                <SelectItem value="side-by-side">Side-by-Side Metrics</SelectItem>
                <SelectItem value="yoy">Year-over-Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => handleCompare()}
            disabled={selectedFiles.length < 2}
            className="w-full"
          >
            Generate Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🚀 Implementation Timeline

### Phase 7A: Basic Projects (2 weeks)
- Week 1: Backend (DB schema, API endpoints, file storage)
- Week 2: Frontend (project list, project detail, file upload in context)
- **Milestone:** Users can create projects and upload multiple files

### Phase 7B: File Comparison (1 week)
- Comparison UI modal
- Overlay chart generation
- AI comparison prompts
- **Milestone:** Compare 2+ files side-by-side

### Phase 7C: File Merging (1 week)
- Relationship configuration
- Pandas merge logic
- Cross-file insights
- **Milestone:** Join files and analyze merged data

**Total: 4 weeks for full Projects feature**

---

## 📊 Technical Considerations

### Storage Strategy
```
Before (MVP):
/uploads/
  └─ {upload_id}.csv

After (Projects):
/uploads/
  ├─ {project_id_1}/
  │   ├─ {file_id_1}.csv
  │   ├─ {file_id_2}.csv
  │   └─ {file_id_3}.csv
  └─ {project_id_2}/
      ├─ {file_id_4}.xlsx
      └─ {file_id_5}.csv
```

**Benefits:**
- Easy project cleanup (delete folder)
- Better organization
- Faster backups (zip entire project)

### Caching Strategy
```python
# Cache project metadata (changes infrequently)
CACHE_KEY = f"project:{project_id}:metadata"
TTL = 30 * 60  # 30 minutes

# Cache file schemas (never change)
CACHE_KEY = f"file:{file_id}:schema"
TTL = 24 * 60 * 60  # 24 hours

# Invalidate on updates
def update_project_name(project_id, new_name):
    db.update_project(project_id, name=new_name)
    cache.delete(f"project:{project_id}:metadata")
```

### Migration from MVP
```python
# Automatic migration: Create default project for each user
def migrate_to_projects():
    for user in User.all():
        # Create default project
        project = Project.create(
            owner_id=user.id,
            name=f"{user.name}'s Analyses",
            description="Auto-created during upgrade"
        )
        
        # Move standalone uploads
        for upload in Upload.filter(user_id=user.id):
            File.create(
                project_id=project.id,
                filename=upload.filename,
                file_path=upload.file_path,
                schema_json=upload.schema
            )
```

---

## 💡 Key Benefits

### For Users
✅ **Organization:** All related work in one place  
✅ **Persistence:** Return to projects days/weeks later  
✅ **Comparison:** Side-by-side analysis of multiple datasets  
✅ **Merging:** Join related data (customers + orders)  
✅ **Insights:** AI understands cross-file context  

### For Business
✅ **Engagement:** Users return more frequently (project-based workflow)  
✅ **Value:** Unlock advanced use cases (multi-file analysis)  
✅ **Monetization:** Premium tier for unlimited projects/files  
✅ **Collaboration:** Foundation for team features (Phase 8)  
✅ **Retention:** Persistent projects increase stickiness  

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Projects created per user | ≥ 3 in first month |
| Files per project (avg) | 3-5 files |
| Multi-file comparisons | ≥ 30% of projects |
| Project return rate | ≥ 60% within 7 days |
| Cross-file insights quality | ≥ 85% coherent |

---

## 🔮 Future Vision

Projects become the foundation for:
- **Team Collaboration** (Phase 8): Share projects with teammates
- **Data Pipelines:** Auto-update projects from connected sources
- **Templates:** Pre-configured project structures for common use cases
- **Version Control:** Snapshot projects at key milestones
- **Project Marketplace:** Share project templates with community

---

**Ready to implement Projects? This feature transforms Hikaru from a single-file analyzer into a full-fledged BI workspace!** 🚀
