"use client";

import { useState, type ReactNode } from "react";
import { Pencil, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ErrorState } from "@/components/shared/data-state";
import { useAccount } from "../services/useAccount";
import { ProfileForm } from "./profile-form";

/**
 * "Personal information" backed by the real `GET /api/v1/customers/me`. Renders
 * loading, error (with retry) and loaded states, and toggles the inline edit
 * form. All data comes from the authenticated session — no id is ever entered by
 * hand. Identity fields (username, email, verification, roles) are read-only
 * because Keycloak owns them.
 */
export function ProfileCard() {
  const query = useAccount();
  const [editing, setEditing] = useState(false);

  if (query.isLoading) {
    return (
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  }

  const user = query.data;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">Personal information</h2>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Edit profile
          </Button>
        ) : null}
      </div>

      {editing ? (
        <ProfileForm user={user} onDone={() => setEditing(false)} />
      ) : (
        <dl className="flex flex-col gap-3">
          <Row label="Name">
            {fullName ? (
              <span className="text-sm font-medium text-foreground">{fullName}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Not set</span>
            )}
          </Row>
          <Row label="Username">
            <span className="text-sm font-medium text-foreground">{user.username || "—"}</span>
          </Row>
          <Row label="Email">
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{user.email || "—"}</span>
              {user.email ? (
                user.emailVerified ? (
                  <Badge variant="success">
                    <ShieldCheck className="size-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <ShieldAlert className="size-3" />
                    Unverified
                  </Badge>
                )
              ) : null}
            </span>
          </Row>
          <Row label="Phone">
            {user.phoneNumber ? (
              <span className="text-sm font-medium text-foreground">{user.phoneNumber}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Not set</span>
            )}
          </Row>
          <Row label="Preferred language">
            {user.preferredLocale ? (
              <span className="text-sm font-medium text-foreground">{user.preferredLocale}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Not set</span>
            )}
          </Row>
          {user.roles.length > 0 ? (
            <Row label="Account type">
              <span className="flex flex-wrap justify-end gap-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </span>
            </Row>
          ) : null}
        </dl>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
