"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Select } from "@repo/ui/components/select";
import type { CategoryResponse } from "@/core/api";

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Newest" },
  { value: "price,asc", label: "Price: low to high" },
  { value: "price,desc", label: "Price: high to low" },
  { value: "name,asc", label: "Name: A-Z" },
] as const;

export interface ProductFiltersValue {
  keyword: string;
  categoryId: string; // "" = all
  sort: string;
}

export function ProductFilters({
  value,
  categories,
  onChange,
}: {
  value: ProductFiltersValue;
  categories: CategoryResponse[];
  onChange: (next: ProductFiltersValue) => void;
}) {
  const [keywordDraft, setKeywordDraft] = useState(value.keyword);

  function commitKeyword() {
    if (keywordDraft !== value.keyword) onChange({ ...value, keyword: keywordDraft });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products…"
          value={keywordDraft}
          onChange={(e) => setKeywordDraft(e.target.value)}
          onBlur={commitKeyword}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitKeyword();
          }}
          className="pl-9"
        />
      </div>

      <Select
        value={value.categoryId}
        onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
        className="sm:max-w-[200px]"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value })}
        className="sm:max-w-[200px]"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
