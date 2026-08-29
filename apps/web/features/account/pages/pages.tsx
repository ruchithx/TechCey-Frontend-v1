"use client";

import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { useAuth } from "@/core/auth";
import { ProfileCard } from "../components/profile-card";
import { NotificationList } from "../components/notification-list";

export function AccountPage() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Your account</h1>

        <ProfileCard />

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/orders">View orders</Link>
          </Button>
          <Button variant="outline" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold text-foreground">Notifications</h2>
        <NotificationList />
      </div>
    </div>
  );
}
