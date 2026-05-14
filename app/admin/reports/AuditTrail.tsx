import { getAuditTrail } from "@/app/actions/reports";
import { AuditTrailTable, type SerializedAuditEvent } from "./AuditTrailTable";

export async function AuditTrail({ cooperativeId }: { cooperativeId: string }) {
  const events = await getAuditTrail(cooperativeId);

  const serialized: SerializedAuditEvent[] = events.map((e) => ({
    id: e.id,
    timestamp: e.timestamp.toISOString(),
    eventType: e.eventType,
    actorName: e.actorName,
    entityType: e.entityType,
    entityId: e.entityId,
  }));

  return <AuditTrailTable events={serialized} />;
}
