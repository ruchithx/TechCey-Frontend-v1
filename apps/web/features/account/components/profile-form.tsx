"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import type { CurrentUserResponse } from "@/core/api";
import { profileSchema, type ProfileFormValues } from "../models/profile-schema";
import { useUpdateProfile } from "../services/useCurrentUser";

const FIELDS = ["firstName", "lastName"] as const;

/** Edit `firstName` / `lastName` — the only profile fields user-service exposes for self-service. */
export function ProfileForm({
  user,
  onDone,
}: {
  user: CurrentUserResponse;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
      });
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
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <span>Username and email are managed by your sign-in provider and can&apos;t be changed here.</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={updateProfile.isPending || !form.formState.isDirty}>
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={updateProfile.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
