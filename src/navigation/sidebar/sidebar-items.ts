import {
  LayoutDashboard,
  FileText,
  Database,
  BarChart3,
  Settings,
  Users,
  Shield,
  Activity,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
      {
        title: "Activity",
        url: "/dashboard/activity",
        icon: Activity,
      },
    ],
  },
  {
    id: 2,
    label: "Certificates",
    items: [
      {
        title: "All Certificates",
        url: "/dashboard/certificates",
        icon: FileText,
      },
      {
        title: "Report Viewer",
        url: "/dashboard/report-viewer",
        icon: Eye,
      },
      {
        title: "Validated",
        url: "/dashboard/validated",
        icon: CheckCircle,
        isNew: true,
      },
    ],
  },
  {
    id: 3,
    label: "Management",
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
        comingSoon: true,
      },
      {
        title: "Roles & Permissions",
        url: "/dashboard/roles",
        icon: Shield,
        comingSoon: true,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
]; 