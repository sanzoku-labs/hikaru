import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type { ProjectResponse, ProjectCreate } from "@/types";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/shared/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  Plus,
  Calendar,
  FileText,
  ArrowRight,
  Search,
  MoreVertical,
  Grid3x3,
  List,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "files">("recent");
  const [filterBy, setFilterBy] = useState<"all" | "active" | "archived">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listProjects(false);
      setProjects(response.projects);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setCreating(true);
      const projectData: ProjectCreate = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      };
      const project = await api.createProject(projectData);
      setProjects([project, ...projects]);
      setNewProjectDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      // Navigate to the new project
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleArchiveProject = async (projectId: number) => {
    try {
      await api.updateProject(projectId, { is_archived: true });
      setProjects(
        projects.map((p) =>
          p.id === projectId ? { ...p, is_archived: true } : p,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Failed to archive project");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await api.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "files") {
        return (b.file_count || 0) - (a.file_count || 0);
      }
      return 0;
    });

    return sorted;
  }, [projects, searchTerm, sortBy]);

  // Get recent projects (top 3 by update time) - for future use
  // const recentProjects = useMemo(() => {
  //   return [...projects]
  //     .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  //     .slice(0, 3)
  // }, [projects])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => !p.is_archived).length;
    const totalFiles = projects.reduce(
      (sum, p) => sum + (p.file_count || 0),
      0,
    );

    return {
      totalProjects: total,
      activeProjects: active,
      filesAnalyzed: totalFiles,
      reportsGenerated: totalFiles * 2, // Mock: assume 2 reports per file
    };
  }, [projects]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">
              Manage multi-file workspaces for complex data analysis
            </p>
          </div>
          <Dialog
            open={newProjectDialogOpen}
            onOpenChange={setNewProjectDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a workspace to upload and analyze multiple data files
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Q4 Sales Analysis"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateProject();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">
                    Description (Optional)
                  </Label>
                  <Input
                    id="project-description"
                    placeholder="Brief description of this project..."
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setNewProjectDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || creating}
                  >
                    {creating ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Overview */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total Projects"
              value={stats.totalProjects}
              icon={FolderOpen}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
            />
            <StatCard
              label="Active Projects"
              value={stats.activeProjects}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-100"
            />
            <StatCard
              label="Files Analyzed"
              value={stats.filesAnalyzed}
              icon={FileSpreadsheet}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
            />
            <StatCard
              label="Reports Generated"
              value={stats.reportsGenerated}
              icon={BarChart3}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
            />
          </div>
        )}

        {/* Search and Filter Bar */}
        {!loading && projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterBy}
                onValueChange={(v: any) => setFilterBy(v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="files">Files</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first project to start uploading and analyzing
              multiple data files together
            </p>
            <Button onClick={() => setNewProjectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <>
            {/* Recently Opened Section - Hidden for now to focus on main list */}

            {/* All Projects Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {searchTerm ? "Search Results" : "All Projects"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedProjects.length}{" "}
                  {filteredAndSortedProjects.length === 1
                    ? "project"
                    : "projects"}
                </span>
              </div>

              {filteredAndSortedProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No projects found matching "{searchTerm}"
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
                >
                  {filteredAndSortedProjects.map((project) => {
                    const status = project.is_archived
                      ? "Archived"
                      : (project.file_count || 0) > 0
                        ? "Active"
                        : "Empty";
                    const statusColor =
                      status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "Archived"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-blue-100 text-blue-700";

                    return (
                      <Card
                        key={project.id}
                        data-testid="project-card"
                        className="hover:shadow-card-hover transition-all cursor-pointer group"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                                <FolderOpen className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                                  {project.name}
                                </CardTitle>
                                {project.description && (
                                  <CardDescription className="line-clamp-1 text-xs mt-1">
                                    {project.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                className={statusColor}
                                variant="secondary"
                              >
                                {status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/projects/${project.id}`);
                                    }}
                                  >
                                    Open Project
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/projects/${project.id}`);
                                    }}
                                  >
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveProject(project.id);
                                    }}
                                    className="text-orange-600"
                                  >
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(project.id);
                                    }}
                                    className="text-red-600"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              <span>{project.file_count || 0} files</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(project.updated_at)}</span>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${project.id}`);
                              }}
                            >
                              Open Project
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
