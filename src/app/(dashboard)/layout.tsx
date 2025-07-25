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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

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
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Spinner className="w-12 h-12" />
        </div>
    )
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

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
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-sm">
                <span>{user.email}</span>
                 <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                </Button>
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
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container p-4 md:p-8">{children}</main>
    </div>
  );
}
