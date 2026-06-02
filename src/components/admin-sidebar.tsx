"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  List,
  Users,
  Settings,
  Menu,
  LogOut,
  Shield,
  BarChart3,
  Package,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/jobs", label: "Manage Print Requests", icon: List },
  { href: "/admin/sales", label: "Sales", icon: BarChart3 },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Shop Settings", icon: Settings },
];

interface SidebarUser {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string;
}

function NavContent({
  user,
  pathname,
  onNavigate,
}: {
  user: SidebarUser;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Black Print"
            width={120}
            height={45}
            className="h-10 w-auto"
            priority
          />
          <Shield className="h-4 w-4 text-primary ml-1" />
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 px-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || user.username}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar({
  user,
  children,
}: {
  user: SidebarUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen lg:overflow-hidden">
      <aside className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:h-[100dvh] lg:w-64 border-r bg-card overflow-y-auto z-30">
        <NavContent user={user} pathname={pathname} onNavigate={() => {}} />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-card z-50 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent user={user} pathname={pathname} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="ml-3">
          <Image
            src="/logo.png"
            alt="Black Print"
            width={100}
            height={38}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0 lg:h-[100dvh] lg:overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
