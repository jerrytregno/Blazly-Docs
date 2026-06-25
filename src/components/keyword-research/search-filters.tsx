"use client";

import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KeywordResearchFilters({
  category,
  location,
  onCategoryChange,
  onLocationChange,
  onSearch,
  searching,
  disabled,
  canRunSearch = true,
  cooldownMessage,
}: {
  category: string;
  location: string;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
  searching?: boolean;
  disabled?: boolean;
  canRunSearch?: boolean;
  cooldownMessage?: string | null;
}) {
  const fieldsReady = Boolean(category.trim() && location.trim());
  const canSearch = fieldsReady && canRunSearch;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="kr-category">Category</Label>
        <Input
          id="kr-category"
          placeholder="e.g. Pub, Restaurant, Dentist"
          value={category}
          disabled={disabled}
          onChange={(e) => onCategoryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSearch && !disabled) onSearch();
          }}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="kr-location">Location</Label>
        <Input
          id="kr-location"
          placeholder="e.g. Chennai, Bangalore, Mumbai"
          value={location}
          disabled={disabled}
          onChange={(e) => onLocationChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSearch && !disabled) onSearch();
          }}
        />
      </div>

      <Button
        type="button"
        onClick={onSearch}
        disabled={disabled || !canSearch || searching}
        className="w-full shrink-0 gap-2 sm:w-auto"
      >
        {searching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        Search
      </Button>
      </div>

      {!canRunSearch && cooldownMessage && (
        <p className="text-sm text-amber-700">{cooldownMessage}</p>
      )}
    </div>
  );
}
