"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  NotebookTabs,
  MessageSquare,
  ClipboardCheck,
  CalendarDays,
  Image as ImageIcon,
  Users,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="w-8 h-8" />
              <span className="inline-block font-bold">Sahayak</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link
                href="/"
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              {menuItems.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                    pathname === href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/">Dashboard</Link>
                </DropdownMenuItem>
                {menuItems.map(({ href, label }) => (
                  <DropdownMenuItem key={label} asChild>
                    <Link href={href}>{label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 container p-4 md:p-8">{children}</main>
    </div>
  );
}
