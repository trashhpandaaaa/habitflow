import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useUser, SignOutButton } from '@clerk/nextjs';
import { User, LogOut } from 'lucide-react';

interface NavbarItem {
  href: string;
  children: React.ReactNode;
}

interface Props {
  items: NavbarItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NavbarSidebar = ({ items, open, onOpenChange }: Props) => {
  const { isSignedIn, user } = useUser();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 transition-none">
        <SheetHeader className="p-4 border-b text-xl font-semibold">
          <SheetTitle>HabitFlow</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
              onClick={() => onOpenChange(false)}
            >
              {item.children}
            </Link>
          ))}
          <div className="border-t">
            {isSignedIn ? (
              <div className="flex flex-col">
                <Link
                  href="/profile"
                  className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center gap-2 text-base font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  <User className="h-4 w-4" />
                  <span>{user?.firstName || 'User'}</span>
                </Link>
                <SignOutButton>
                  <button
                    className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center gap-2 text-base font-medium"
                    onClick={() => onOpenChange(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  Start Selling
                </Link>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
