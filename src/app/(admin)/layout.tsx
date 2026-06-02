import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { DashboardScrollLock } from "@/components/dashboard-scroll-lock";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardScrollLock />
      <AdminSidebar user={session.user}>
        {children}
      </AdminSidebar>
    </div>
  );
}
