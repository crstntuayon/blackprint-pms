import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClientSidebar } from "@/components/client-sidebar";
import { ChatButton } from "@/components/chat-button";
import { DashboardScrollLock } from "@/components/dashboard-scroll-lock";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardScrollLock />
      <ClientSidebar user={session.user}>
        {children}
      </ClientSidebar>
      <ChatButton currentUserId={session.user.id} />
    </div>
  );
}
