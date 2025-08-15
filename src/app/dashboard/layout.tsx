import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/stores/preferences/preferences-provider";
import { ModernDashboardLayout } from "@/components/dashboard/layout/modern-dashboard-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  if (!session) {
    redirect("/login");
  }

  return (
    <PreferencesProvider>
      <ModernDashboardLayout defaultOpen={defaultOpen}>{children}</ModernDashboardLayout>
    </PreferencesProvider>
  );
}
