/**
 * Sidebar - Left sidebar navigation matching Mockup 1
 *
 * Features:
 * - Persistent left sidebar (240px width)
 * - Logo/branding at top
 * - Navigation items with icons
 * - Active state highlighting
 * - Collapsible on mobile (sheet component)
 * - User profile section at bottom
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FolderOpen,
  BarChart3,
  GitCompare,
  GitMerge,
  MessageSquare,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string | number;
}

const navItems: NavItem[] = [
  {
    id: "projects",
    label: "Projects",
    icon: FolderOpen,
    href: "/projects",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    id: "comparisons",
    label: "Comparisons",
    icon: GitCompare,
    href: "/comparisons",
  },
  {
    id: "merging",
    label: "Merging",
    icon: GitMerge,
    href: "/merging",
  },
  {
    id: "chat",
    label: "Q&A Chat",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    id: "exports",
    label: "Exports",
    icon: Download,
    href: "/exports",
  },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({
  className,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggleCollapse?.(newState);
  };

  const isActive = (href: string) => {
    if (href === "/projects") {
      return (
        location.pathname === href || location.pathname.startsWith("/projects/")
      );
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-60",
        className,
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <Link to="/projects" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Hikaru</span>
          </Link>
        )}
        {isCollapsed && (
          <Link
            to="/projects"
            className="flex items-center justify-center w-full"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.id}>
                <Link to={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size={isCollapsed ? "icon" : "sm"}
                    className={cn(
                      "w-full justify-start transition-colors",
                      isCollapsed ? "px-0" : "px-3",
                      active &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      !active &&
                        "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="ml-auto text-xs font-medium bg-primary-foreground/20 px-2 py-0.5 rounded-badge">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="w-full justify-center"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs text-muted-foreground">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* User Profile Section */}
      {!isCollapsed && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-muted-foreground truncate">
                user@example.com
              </p>
            </div>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="border-t border-border p-2">
          <Avatar className="h-9 w-9 mx-auto">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </aside>
  );
}
