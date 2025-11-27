/**
 * Workspace Tabs Component
 * Tab navigation for different workspaces (preview, analytics, compare, merge, chat)
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, BarChart3, GitCompare, GitMerge, MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';

interface WorkspaceTabsProps {
  activeTab: 'preview' | 'analytics' | 'compare' | 'merge' | 'chat';
  onTabChange: (tab: 'preview' | 'analytics' | 'compare' | 'merge' | 'chat') => void;
  hasAnalysis: boolean;
  canCompare: boolean;
  canMerge: boolean;
  previewContent: ReactNode;
  analyticsContent: ReactNode;
  compareContent: ReactNode;
  mergeContent: ReactNode;
  chatContent: ReactNode;
}

export function WorkspaceTabs({
  activeTab,
  onTabChange,
  hasAnalysis,
  canCompare,
  canMerge,
  previewContent,
  analyticsContent,
  compareContent,
  mergeContent,
  chatContent,
}: WorkspaceTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="preview">
          <Table className="h-4 w-4 mr-2" />
          Preview
        </TabsTrigger>
        <TabsTrigger value="analytics" disabled={!hasAnalysis}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="compare" disabled={!canCompare}>
          <GitCompare className="h-4 w-4 mr-2" />
          Compare
        </TabsTrigger>
        <TabsTrigger value="merge" disabled={!canMerge}>
          <GitMerge className="h-4 w-4 mr-2" />
          Merge
        </TabsTrigger>
        <TabsTrigger value="chat">
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="space-y-4 mt-6">
        {previewContent}
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4 mt-6">
        {analyticsContent}
      </TabsContent>

      <TabsContent value="compare" className="space-y-6 mt-6">
        {compareContent}
      </TabsContent>

      <TabsContent value="merge" className="space-y-6 mt-6">
        {mergeContent}
      </TabsContent>

      <TabsContent value="chat" className="space-y-4 mt-6">
        {chatContent}
      </TabsContent>
    </Tabs>
  );
}
