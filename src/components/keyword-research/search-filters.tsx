"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KeywordResearchFilters({
  category,
  location,
  onCategoryChange,
  onLocationChange,
  disabled,
}: {
  category: string;
  location: string;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="kr-category">Category</Label>
        <Input
          id="kr-category"
          placeholder="e.g. Pub, Restaurant, Dentist"
          value={category}
          disabled={disabled}
          onChange={(e) => onCategoryChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kr-location">Location</Label>
        <Input
          id="kr-location"
          placeholder="e.g. Chennai, Bangalore, Mumbai"
          value={location}
          disabled={disabled}
          onChange={(e) => onLocationChange(e.target.value)}
        />
      </div>
    </div>
  );
}
