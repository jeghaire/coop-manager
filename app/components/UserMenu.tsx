"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "../lib/auth-client";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  User2Icon,
} from "lucide-react";
import { AvatarStub } from "./avatar";
import Link from "next/link";

export default function UserMenu({
  user,
}: {
  user: {
    name: string;
    email: string;
    image: string;
    role: string;
  };
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({
      fetchOptions: { onSuccess: () => router.push("/auth/signin") },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative group"
          >
            <AvatarStub {...user} className="grayscale" />
            <ChevronDown className="absolute -bottom-1 -right-2 text-zinc-500 transition-all duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-data-popup-open:hidden" />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <AvatarStub {...user} className="grayscale" />
              <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight">
                <div className="flex flex-col">
                  <span className="truncate font-medium text-accent-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                {user.role && (
                  <Badge
                    variant={
                      user.role === "OWNER"
                        ? "success"
                        : user.role === "ADMIN"
                          ? "warning"
                          : user.role === "TREASURER"
                            ? "sky"
                            : "success"
                    }
                    className="w-fit text-[10px]"
                  >
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link href="/dashboard/profile">
                <User2Icon />
                Profile
              </Link>
            }
          ></DropdownMenuItem>
          {user.role === "OWNER" && (
            <DropdownMenuItem
              render={
                <Link href="/dashboard/billing">
                  <CreditCardIcon />
                  Billing
                </Link>
              }
            ></DropdownMenuItem>
          )}
          <DropdownMenuItem
            render={
              <Link href="/dashboard/settings">
                <SettingsIcon />
                Settings
              </Link>
            }
          ></DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
