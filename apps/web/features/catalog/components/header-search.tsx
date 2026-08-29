"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";

/** Fills the header's `header-search` slot. Submits to /search?keyword=… */
export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const keyword = value.trim();
    router.push(keyword ? `/search?keyword=${encodeURIComponent(keyword)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products…"
        className="pl-9"
        aria-label="Search products"
      />
    </form>
  );
}
