import AnalyticsOverview from "@/components/dashboard/analytics/analytics-overview";

export default function AnalyticsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 px-4 lg:px-6">
        <AnalyticsOverview />
      </div>
    </div>
  );
}



