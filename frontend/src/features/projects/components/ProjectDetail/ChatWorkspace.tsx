/**
 * Chat Workspace Component
 * Placeholder for future chat functionality
 */

import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export function ChatWorkspace() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Chat feature coming soon</p>
        <p className="text-muted-foreground text-center max-w-md">
          Ask questions about your data and get AI-powered insights
        </p>
      </CardContent>
    </Card>
  );
}
