import { Card, CardContent } from '@/components/ui/card';

export function TGERunbook() {
  return (
    <article className="prose max-w-none">
      <h2 className="text-xl font-semibold text-foreground">TGE Runbook & Launch Checklist</h2>
      <div className="text-sm text-muted-foreground">
        <ol className="list-decimal pl-5 space-y-2">
          <li>Finalize tokenomics, allocations, and vesting schedules.</li>
          <li>Freeze code: audits complete, tags created, and artifacts verified.</li>
          <li>Provision production secrets (RPCs, deployer keys, 1inch API) in Supabase.</li>
          <li>Dry-run on testnet with identical parameters and scripts.</li>
          <li>Deploy production contracts; verify and publish addresses.</li>
          <li>Seed initial liquidity and lock LP for the planned duration.</li>
          <li>Enable production mode toggle; remove testnet lock.</li>
          <li>Activate monitoring, alerts, and incident playbooks.</li>
          <li>Publish launch comms: docs, explorers, and safety notes.</li>
        </ol>
      </div>
      <h3 className="text-lg font-semibold mt-4 text-foreground">Pre-TGE Testing (Recommended)</h3>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>Use Base Sepolia for full end-to-end rehearsals.</li>
        <li>Optionally fork mainnet locally for gas and MEV rehearsal.</li>
        <li>Never deploy throwaway tokens on mainnet for testing.</li>
      </ul>
      <h3 className="text-lg font-semibold mt-4 text-foreground">Rollback Plan</h3>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>Emergency pause playbook and keys accessible.</li>
        <li>Communication template for coordinated announcements.</li>
        <li>Post-mortem workflow and remediation owners assigned.</li>
      </ul>
    </article>
  );
}
