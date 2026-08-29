"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import type { CustomerAccountResponse, UpdateCustomerAccountRequest } from "@/core/api";
import { profileSchema, type ProfileFormValues } from "../models/profile-schema";
import { useUpdateAccount } from "../services/useAccount";

const FIELDS = ["firstName", "lastName", "phoneNumber", "preferredLocale"] as const;

/**
 * Edit the fields user-service exposes for customer self-service through
 * `PUT /api/v1/customers/me`: `firstName` / `lastName` (proxied to Keycloak) and
 * the backend-owned `phoneNumber` / `preferredLocale`. `username` and `email`
 * are Keycloak identity and are not editable here.
 *
 * Only changed fields are sent (the backend does a partial update), so a bare
 * save never wipes the Keycloak name.
 */
export function ProfileForm({
  user,
  onDone,
}: {
  user: CustomerAccountResponse;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const updateAccount = useUpdateAccount();

  const initial: ProfileFormValues = {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phoneNumber: user.phoneNumber ?? "",
    preferredLocale: user.preferredLocale ?? "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // Send only what changed; "" on an optional field means "clear it".
    const patch: UpdateCustomerAccountRequest = {};
    if (values.firstName !== initial.firstName) patch.firstName = values.firstName;
    if (values.lastName !== initial.lastName) patch.lastName = values.lastName;
    if (values.phoneNumber !== initial.phoneNumber) patch.phoneNumber = values.phoneNumber;
    if (values.preferredLocale !== initial.preferredLocale) {
      patch.preferredLocale = values.preferredLocale;
    }

    if (Object.keys(patch).length === 0) {
      onDone();
      return;
    }

    try {
      await updateAccount.mutateAsync(patch);
      toast({ title: "Profile updated", variant: "success" });
      onDone();
    } catch (error) {
      if (!applyFieldErrors(error, form.setError, FIELDS)) {
        toast({
          title: "Couldn't update your profile",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          htmlFor="firstName"
          required
          error={form.formState.errors.firstName?.message}
        >
          <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
        </Field>
        <Field
          label="Last name"
          htmlFor="lastName"
          required
          error={form.formState.errors.lastName?.message}
        >
          <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
        </Field>
        <Field
          label="Phone"
          htmlFor="phoneNumber"
          hint="Optional. Digits and + ( ) - . only."
          error={form.formState.errors.phoneNumber?.message}
        >
          <Input
            id="phoneNumber"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            {...form.register("phoneNumber")}
          />
        </Field>
        <Field
          label="Preferred language"
          htmlFor="preferredLocale"
          hint="Optional. A locale code like en-US."
          error={form.formState.errors.preferredLocale?.message}
        >
          <Input
            id="preferredLocale"
            autoComplete="language"
            placeholder="en-US"
            {...form.register("preferredLocale")}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <span>
          Username and email are managed by your sign-in provider and can&apos;t be changed here.
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={updateAccount.isPending || !form.formState.isDirty}>
          {updateAccount.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={updateAccount.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
