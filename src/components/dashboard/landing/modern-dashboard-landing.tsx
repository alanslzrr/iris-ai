"use client";

import { Separator } from "@/components/ui/separator";

// removed header icons and refresh imports

import { ModernMetricsCards } from "./components/modern-metrics-cards";
import Link from "next/link";
import { ProcessingTimelineOverview } from "./components/processing-timeline-overview";
import { ModernDataTable } from "./components/modern-data-table";

export function ModernDashboardLanding() {
  // Page-level refresh moved to global header

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 px-4 lg:px-6">
      {/* Removed page header and separator per request */}

      {/* Integration metrics (section title removed) */}
      <div className="space-y-4">
        <ModernMetricsCards />
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Analysis overview (section title removed) */}
      <div className="space-y-4">
        <ProcessingTimelineOverview />
        <div>
          <Link href="/dashboard/analytics" className="inline-flex items-center text-sm font-medium underline-offset-4 hover:underline">
            Explore full analytics
          </Link>
        </div>
      </div>

      <Separator className="my-4 md:my-6" />

      {/* Recent Activity Table (section title removed) */}
      <div className="space-y-4">
        <ModernDataTable />
      </div>
      </div>
    </div>
  );
} 