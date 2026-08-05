import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { PlayIcon } from "lucide-react";

import type { Region, Tier } from "#/features/inspector/server/catalog";
import { REGIONS, TIERS } from "#/features/inspector/server/catalog";

interface RequestConsoleProps {
  tenant: string;
  region: Region;
  tier: Tier;
  pending: boolean;
  onTenantChange: (tenant: string) => void;
  onRegionChange: (region: Region) => void;
  onTierChange: (tier: Tier) => void;
  onSend: () => void;
}

const REGION_COPY: Record<Region, string> = { eu: "Europe", us: "United States", apac: "Asia-Pacific" };
const TIER_COPY: Record<Tier, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };

/** The tenant context a request carries — the only input every slot decision is taken against. */
export function RequestConsole({
  tenant,
  region,
  tier,
  pending,
  onTenantChange,
  onRegionChange,
  onTierChange,
  onSend,
}: RequestConsoleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request context</CardTitle>
        <CardDescription>
          Each send builds a child container for this tenant and resolves the pipeline inside it. Pick{" "}
          <span className="font-medium text-foreground">Asia-Pacific + Enterprise</span> to see the container refuse a
          slot it cannot decide.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="tenant">Tenant</Label>
          <Input
            id="tenant"
            onChange={(event) => {
              onTenantChange(event.target.value);
            }}
            placeholder="acme-gmbh"
            value={tenant}
          />
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Region</legend>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((option) => (
              <Button
                key={option}
                onClick={() => {
                  onRegionChange(option);
                }}
                size="sm"
                variant={option === region ? "default" : "outline"}
              >
                {REGION_COPY[option]}
                <Badge variant="secondary">region:{option}</Badge>
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Contract tier</legend>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((option) => (
              <Button
                key={option}
                onClick={() => {
                  onTierChange(option);
                }}
                size="sm"
                variant={option === tier ? "default" : "outline"}
              >
                {TIER_COPY[option]}
                {option === "enterprise" ? <Badge variant="secondary">tier:enterprise</Badge> : null}
              </Button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Only <code className="font-mono">enterprise</code> names a second tag, which is what lets a negotiated
            binding outrank the regional default.
          </p>
          <Button disabled={pending} onClick={onSend}>
            <PlayIcon aria-hidden />
            {pending ? "Resolving…" : "Send request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
