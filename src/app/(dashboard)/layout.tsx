"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  NotebookTabs,
  MessageSquare,
  ClipboardCheck,
  CalendarDays,
  Image as ImageIcon,
  Users,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/content-generator", label: "Content Generator", Icon: BookOpen },
  { href: "/differentiated-worksheets", label: "Differentiated Worksheets", Icon: NotebookTabs },
  { href: "/teaching-assistant", label: "Teaching Assistant", Icon: MessageSquare },
  { href: "/assessment-generator", label: "Assessment Generator", Icon: ClipboardCheck },
  { href: "/lesson-planner", label: "Lesson Planner", Icon: CalendarDays },
  { href: "/visual-aid", label: "Visual Aid Generator", Icon: ImageIcon },
  { href: "/progress-tracker", label: "Progress Tracker", Icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline group-data-[collapsible=icon]:hidden">
              Sahayak
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map(({ href, label, Icon }) => (
              <SidebarMenuItem key={href}>
                <Link href={href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === href}
                    tooltip={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
