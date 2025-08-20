"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavbarSidebar } from "./navbar-sidebar";
import React from "react";
import { MenuIcon, LogOut, User } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

interface NavbarItemProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavbarItem = ({ href, children, isActive = false }: NavbarItemProps) => {
  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        "bg-transparent hover:bg-transparent rounded-full hover:border-primary border-transparent px-3 text-lg",
        isActive && "bg-black text-white hover:bg-white hover:text-black"
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};

const navbarItems = [
  {
    href: "/",
    children: "Dashboard",
  },
  {
    href: "/habits",
    children: "Habits",
  },
  {
    href: "/pomodoro",
    children: "Pomodoro",
  },
  {
    href: "/statistics",
    children: "Statistics",
  },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <nav className="h-20 flex border-b justify-between font-medium bg-white">
      <Link href="/" className="pl-6 flex items-center">
        <span className={cn("xl:text-4xl text-2xl font-semibold")}>
          HabitFlow
        </span>
      </Link>

      <NavbarSidebar
        items={navbarItems}
        open={isSidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <section className="flex xl:gap-4 gap-1">
        <div className="items-center xl:gap-4 gap-1 hidden lg:flex">
          {navbarItems.map((item) => (
            <NavbarItem
              key={item.href}
              href={item.href}
              isActive={pathname === item.href}
            >
              {item.children}
            </NavbarItem>
          ))}
        </div>

        <div className="hidden lg:flex items-center">
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="border-l border-t-0 border-b-0 border-r-0 xl:px-12 px-8 h-full rounded-none bg-white hover:bg-pink-400 transition-colors text-lg flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.firstName || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <SignOutButton>
                    <button className="flex items-center gap-2 w-full text-left">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="ml-4">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
        <div className="flex lg:hidden items-center justify-center">
          <Button
            variant="ghost"
            className="size-12 border-transparent bg-white text-3xl"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="w-8 h-8" />
          </Button>
        </div>
      </section>
    </nav>
  );
};
