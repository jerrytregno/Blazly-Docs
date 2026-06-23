import Image from "next/image";
import { Star, MapPin, Globe, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRating } from "@/lib/utils";
import type { LocalBusiness } from "@/types";

interface BusinessCardProps {
  business: LocalBusiness;
  highlight?: boolean;
  onSelect?: (business: LocalBusiness) => void;
}

export function BusinessCard({
  business,
  highlight,
  onSelect,
}: BusinessCardProps) {
  return (
    <Card
      className={`transition-shadow hover:shadow-md ${highlight ? "ring-2 ring-primary" : ""} ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(business)}
    >
      <CardContent className="flex gap-4 p-4">
        {business.thumbnail && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={business.thumbnail}
              alt={business.title ?? "Business"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                {business.position != null && (
                  <Badge variant="secondary">#{business.position}</Badge>
                )}
                <h4 className="font-semibold">{business.title ?? "Unknown"}</h4>
              </div>
              {business.type && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {business.type}
                </p>
              )}
            </div>
            {business.rating != null && (
              <div className="flex shrink-0 items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{formatRating(business.rating)}</span>
                {business.reviews != null && (
                  <span className="text-muted-foreground">
                    ({business.reviews})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {business.address && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{business.address}</span>
              </p>
            )}
            {business.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {business.phone}
              </p>
            )}
            {business.website && (
              <p className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{business.website}</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
