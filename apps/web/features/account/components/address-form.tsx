"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field } from "@/components/shared/form-field";
import { getErrorMessage } from "@/components/shared/error-message";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import type { AddressRequest, AddressResponse } from "@/core/api";
import { DEFAULT_COUNTRY } from "@/core/config/constants";
import { addressSchema, type AddressFormValues } from "../models/address-schema";

const FIELDS = ["label", "line1", "line2", "city", "state", "zip", "country"] as const;

/**
 * Add / edit form for one address-book entry. Validation mirrors user-service's
 * `AddressRequest`. The parent owns the mutation and passes it in via
 * `onSubmit`; this component only maps the form to an `AddressRequest` and
 * surfaces server-side field errors inline. Promoting an address to the default
 * is done from the list (per-row "Set default"), not here.
 */
export function AddressForm({
  address,
  pending,
  onSubmit,
  onCancel,
}: {
  address?: AddressResponse;
  pending: boolean;
  onSubmit: (body: AddressRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: address?.label ?? "",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      zip: address?.zip ?? "",
      country: address?.country ?? DEFAULT_COUNTRY,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const body: AddressRequest = {
      line1: values.line1,
      city: values.city,
      state: values.state,
      zip: values.zip,
      country: values.country,
    };
    if (values.label) body.label = values.label;
    if (values.line2) body.line2 = values.line2;

    try {
      await onSubmit(body);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError, FIELDS)) {
        form.setError("root", { type: "server", message: getErrorMessage(error) });
      }
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" htmlFor="addr-label" hint="Optional" error={form.formState.errors.label?.message}>
          <Input id="addr-label" placeholder="Home" {...form.register("label")} />
        </Field>
        <Field label="Country" htmlFor="addr-country" required error={form.formState.errors.country?.message}>
          <Input id="addr-country" autoComplete="country-name" {...form.register("country")} />
        </Field>
        <Field
          label="Address line 1"
          htmlFor="addr-line1"
          required
          error={form.formState.errors.line1?.message}
        >
          <Input id="addr-line1" autoComplete="address-line1" {...form.register("line1")} />
        </Field>
        <Field
          label="Address line 2"
          htmlFor="addr-line2"
          hint="Optional"
          error={form.formState.errors.line2?.message}
        >
          <Input id="addr-line2" autoComplete="address-line2" {...form.register("line2")} />
        </Field>
        <Field label="City" htmlFor="addr-city" required error={form.formState.errors.city?.message}>
          <Input id="addr-city" autoComplete="address-level2" {...form.register("city")} />
        </Field>
        <Field label="State" htmlFor="addr-state" required error={form.formState.errors.state?.message}>
          <Input id="addr-state" autoComplete="address-level1" {...form.register("state")} />
        </Field>
        <Field label="ZIP / postcode" htmlFor="addr-zip" required error={form.formState.errors.zip?.message}>
          <Input id="addr-zip" autoComplete="postal-code" {...form.register("zip")} />
        </Field>
      </div>

      {form.formState.errors.root?.message ? (
        <p className="text-xs text-destructive">{form.formState.errors.root.message}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : address ? "Save address" : "Add address"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
