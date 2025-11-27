import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "./app/providers";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { Skeleton } from "./components/ui/skeleton";
import "./index.css";

// Lazy load route components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ProjectListPage = lazy(() => import("./features/projects/components/ProjectList").then(m => ({ default: m.ProjectListPage })));
const ProjectDetailPage = lazy(() => import("./features/projects/components/ProjectDetail").then(m => ({ default: m.ProjectDetailPage })));
const FileAnalysisPage = lazy(() => import("./features/projects/components/FileAnalysis").then(m => ({ default: m.FileAnalysisPage })));
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const Comparisons = lazy(() => import("./pages/Comparisons").then(m => ({ default: m.Comparisons })));
const Merging = lazy(() => import("./pages/Merging").then(m => ({ default: m.Merging })));
const Chat = lazy(() => import("./pages/Chat").then(m => ({ default: m.Chat })));

// Loading fallback component
const PageLoader = () => (
  <div className="container mx-auto px-4 py-8">
    <Skeleton className="h-8 w-64 mb-6" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/projects" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/files/:fileId/analysis"
            element={
              <ProtectedRoute>
                <FileAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comparisons"
            element={
              <ProtectedRoute>
                <Comparisons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merging"
            element={
              <ProtectedRoute>
                <Merging />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>,
);
