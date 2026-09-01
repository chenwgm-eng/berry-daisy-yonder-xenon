import { getMySprint, listMySprints, upsertMySprint } from "./sprints";
import { useSprintStore } from "./store";

/**
 * Pull sprints that exist on the server but not in the local store (the
 * second-device path). Never overwrites a local copy — last-write-wins on the
 * server side is handled at write time; this is strictly additive.
 */
export async function pullMissingFromCloud(): Promise<void> {
  const summaries = await listMySprints();
  const store = useSprintStore.getState();
  for (const s of summaries) {
    if (store.sprints.some((sp) => sp.id === s.id)) continue;
    try {
      const full = await getMySprint({ data: s.id });
      if (full) store.importSprint(full);
    } catch {
      /* skip the row that failed; the rest still land */
    }
  }
}

/** Push every local sprint to the cloud (the first-login import). Idempotent. */
export async function pushAllToCloud(): Promise<number> {
  const { sprints } = useSprintStore.getState();
  for (const sprint of sprints) {
    await upsertMySprint({ data: sprint });
  }
  return sprints.length;
}
