import { getConnections } from "@/lib/data";
import { ProviderConnect } from "@/components/provider-connect";
import { BackfillUsage } from "@/components/backfill-usage";

export default async function ProvidersPage() {
  const connections = await getConnections();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Providers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect your AI accounts so we can measure your usage</p>
      </div>
      <ProviderConnect connections={connections} />
      <BackfillUsage />
    </div>
  );
}
