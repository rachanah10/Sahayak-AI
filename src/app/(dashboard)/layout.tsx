

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  NotebookTabs,
  MessageSquare,
  ClipboardCheck,
  CalendarDays,
  Image as ImageIcon,
  Users,
  Menu,
  LogOut,
  UserPlus,
  PanelLeft,
  Search,
  Library,
  GraduationCap,
  BarChart3,
  Moon,
  Sun,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";


const allMenuItems = [
  { href: "/", label: "Dashboard", Icon: BookOpen, exact: true, roles: ['teacher', 'student', 'admin'] },
  { href: "/content-generator", label: "Content Generator", Icon: BookOpen, roles: ['teacher', 'admin'] },
  { href: "/content-library", label: "Content Library", Icon: Library, roles: ['teacher', 'student', 'admin'] },
  { href: "/homework", label: "Homework", Icon: NotebookTabs, roles: ['teacher', 'admin'] },
  { href: "/teaching-assistant", label: "Teaching Assistant", Icon: MessageSquare, roles: ['teacher', 'admin'] },
  { href: "/studying-assistant", label: "Studying Assistant", Icon: GraduationCap, roles: ['student', 'admin'] },
  { href: "/assessment-generator", label: "Assessment Generator", Icon: ClipboardCheck, roles: ['teacher', 'admin'] },
  { href: "/view-assessments", label: "View Assessments", Icon: Users, roles: ['teacher', 'admin'] },
  { href: "/lesson-planner", label: "Lesson Planner", Icon: CalendarDays, roles: ['teacher', 'admin'] },
  { href: "/progress-tracker", label: "Student Progress", Icon: BarChart3, roles: ['teacher', 'student', 'admin'] },
  { href: "/signup", label: "Add User", Icon: UserPlus, roles: ['admin'] },
];

function getMenuItemsForUser(user: AuthUser | null) {
    if (!user) return [];
    
    const userRole = user.is_admin ? 'admin' : user.role;

    if (!userRole) return [];

    return allMenuItems.filter(item => item.roles.includes(userRole));
}


function SidebarNav({ user, onLinkClick }: { user: AuthUser | null, onLinkClick?: () => void }) {
  const pathname = usePathname();
  const menuItems = getMenuItemsForUser(user);

  return (
    <nav className="grid items-start px-4 text-sm font-medium">
      {menuItems.map(({ href, label, Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  if (loading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Spinner className="w-12 h-12" />
        </div>
    )
  }
  
  const closeSheet = () => setIsSheetOpen(false);

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6" />
              <span className="">Sahayak</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <SidebarNav user={user} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                   <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                   <SheetDescription className="sr-only">Main navigation links for the application.</SheetDescription>
                  <Link href="/" className="flex items-center gap-2 font-semibold" onClick={closeSheet}>
                    <Logo className="h-6 w-6" />
                    <span>Sahayak</span>
                  </Link>
                </SheetHeader>
                <SidebarNav user={user} onLinkClick={closeSheet} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full ml-2">
                <Logo className="h-8 w-8" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account ({user.email})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
