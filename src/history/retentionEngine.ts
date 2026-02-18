import { Snapshot } from './snapshotStore';

export interface RetentionPolicy {
  maxSnapshotsPerFile: number;
  maxTotalStorageMb: number;
  retentionDays: number;
  protectManualCheckpoints: boolean;
}

export function getSnapshotsToDelete(
  snapshots: Snapshot[],
  policy: RetentionPolicy,
  now: number
): Snapshot[] {
  if (snapshots.length === 0) {
    return [];
  }

  const toDelete = new Set<Snapshot>();

  const tooOld = filterByAge(snapshots, policy.retentionDays, now, policy.protectManualCheckpoints);
  tooOld.forEach((s) => toDelete.add(s));

  const tooMany = filterByCount(
    snapshots,
    policy.maxSnapshotsPerFile,
    policy.protectManualCheckpoints
  );
  tooMany.forEach((s) => toDelete.add(s));

  const tooLarge = filterBySize(
    snapshots,
    policy.maxTotalStorageMb,
    policy.protectManualCheckpoints
  );
  tooLarge.forEach((s) => toDelete.add(s));

  return Array.from(toDelete).sort((a, b) => a.timestamp - b.timestamp);
}

function filterByAge(
  snapshots: Snapshot[],
  retentionDays: number,
  now: number,
  protectManualCheckpoints: boolean
): Snapshot[] {
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const cutoffTime = now - retentionMs;

  return snapshots.filter((s) => {
    const isTooOld = s.timestamp < cutoffTime;
    const isProtected = protectManualCheckpoints && s.isCheckpoint;
    return isTooOld && !isProtected;
  });
}

function filterByCount(
  snapshots: Snapshot[],
  maxSnapshotsPerFile: number,
  protectManualCheckpoints: boolean
): Snapshot[] {
  const grouped = groupByFile(snapshots);
  const toDelete: Snapshot[] = [];

  for (const fileSnapshots of Object.values(grouped)) {
    if (fileSnapshots.length > maxSnapshotsPerFile) {
      const sortedByTime = fileSnapshots.sort((a, b) => a.timestamp - b.timestamp);
      const excess = sortedByTime.length - maxSnapshotsPerFile;
      const candidates = protectManualCheckpoints
        ? sortedByTime.filter((s) => !s.isCheckpoint)
        : sortedByTime;
      toDelete.push(...candidates.slice(0, excess));
    }
  }

  return toDelete;
}

function filterBySize(
  snapshots: Snapshot[],
  maxTotalStorageMb: number,
  protectManualCheckpoints: boolean
): Snapshot[] {
  const maxBytes = maxTotalStorageMb * 1024 * 1024;
  const sortedByTime = snapshots.sort((a, b) => a.timestamp - b.timestamp);
  let totalSize = sortedByTime.reduce((acc, s) => acc + s.sizeBytes, 0);
  if (totalSize <= maxBytes) {
    return [];
  }

  const candidates = protectManualCheckpoints
    ? sortedByTime.filter((s) => !s.isCheckpoint)
    : sortedByTime;

  const toDelete: Snapshot[] = [];
  for (const snapshot of candidates) {
    if (totalSize <= maxBytes) {
      break;
    }
    toDelete.push(snapshot);
    totalSize -= snapshot.sizeBytes;
  }

  return toDelete;
}

function groupByFile(snapshots: Snapshot[]): Record<string, Snapshot[]> {
  const grouped: Record<string, Snapshot[]> = {};

  for (const snapshot of snapshots) {
    if (!grouped[snapshot.filePath]) {
      grouped[snapshot.filePath] = [];
    }
    grouped[snapshot.filePath].push(snapshot);
  }

  return grouped;
}
