import { describe, it, expect } from 'vitest';
import { getSnapshotsToDelete, RetentionPolicy } from '../../src/history/retentionEngine';
import { Snapshot } from '../../src/history/snapshotStore';

describe('retentionEngine', () => {
  const now = 1000000000; // Fixed timestamp for testing

  // Helper to create test snapshots
  const createSnapshot = (
    id: string,
    filePath: string,
    timestamp: number,
    sizeBytes: number = 1000,
    isCheckpoint: boolean = false
  ): Snapshot => ({
    id,
    filePath,
    timestamp,
    isCheckpoint,
    hash: `hash-${id}`,
    sizeBytes,
    compressed: false,
  });

  it('keeps all snapshots when under limits', () => {
    const snapshots = [
      createSnapshot('snap1', 'file.md', now - 86400 * 5, 1000), // 5 days old
      createSnapshot('snap2', 'file.md', now - 86400 * 10, 1000), // 10 days old
      createSnapshot('snap3', 'file.md', now, 1000), // current
    ];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 100,
      maxTotalStorageMb: 200,
      retentionDays: 30,
      protectManualCheckpoints: true,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    expect(toDelete).toHaveLength(0);
  });

  it('removes snapshots exceeding maxSnapshotsPerFile', () => {
    const snapshots = [
      createSnapshot('snap1', 'file.md', now - 86400 * 20, 1000),
      createSnapshot('snap2', 'file.md', now - 86400 * 15, 1000),
      createSnapshot('snap3', 'file.md', now - 86400 * 10, 1000),
      createSnapshot('snap4', 'file.md', now - 86400 * 5, 1000),
      createSnapshot('snap5', 'file.md', now, 1000),
    ];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 3,
      maxTotalStorageMb: 200,
      retentionDays: 30,
      protectManualCheckpoints: false,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    expect(toDelete).toHaveLength(2);
    expect(toDelete.map((s) => s.id)).toEqual(['snap1', 'snap2']);
  });

  it('removes snapshots older than retentionDays', () => {
    const snapshots = [
      createSnapshot('snap1', 'file.md', now - 86400 * 40, 1000), // 40 days old
      createSnapshot('snap2', 'file.md', now - 86400 * 35, 1000), // 35 days old
      createSnapshot('snap3', 'file.md', now - 86400 * 20, 1000), // 20 days old
      createSnapshot('snap4', 'file.md', now, 1000), // current
    ];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 100,
      maxTotalStorageMb: 200,
      retentionDays: 30,
      protectManualCheckpoints: false,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    expect(toDelete).toHaveLength(2);
    expect(toDelete.map((s) => s.id)).toEqual(['snap1', 'snap2']);
  });

  it('protects manual checkpoints from retention', () => {
    const snapshots = [
      createSnapshot('snap1', 'file.md', now - 86400 * 40, 1000, false), // 40 days old, not checkpoint
      createSnapshot('snap2', 'file.md', now - 86400 * 35, 1000, true), // 35 days old, IS checkpoint
      createSnapshot('snap3', 'file.md', now - 86400 * 20, 1000, false), // 20 days old
      createSnapshot('snap4', 'file.md', now, 1000, false), // current
    ];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 100,
      maxTotalStorageMb: 200,
      retentionDays: 30,
      protectManualCheckpoints: true,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    // snap1 is old and not protected, snap2 is protected despite being old
    expect(toDelete).toHaveLength(1);
    expect(toDelete[0].id).toBe('snap1');
  });

  it('removes oldest snapshots when storage limit exceeded', () => {
    const snapshots = [
      createSnapshot('snap1', 'file.md', now - 86400 * 20, 60 * 1024 * 1024), // 60 MB, 20 days old
      createSnapshot('snap2', 'file.md', now - 86400 * 10, 60 * 1024 * 1024), // 60 MB, 10 days old
      createSnapshot('snap3', 'file.md', now - 86400 * 5, 60 * 1024 * 1024), // 60 MB, 5 days old
      createSnapshot('snap4', 'file.md', now, 60 * 1024 * 1024), // 60 MB, current
    ];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 100,
      maxTotalStorageMb: 150, // 150 MB limit, but we have 240 MB total
      retentionDays: 30,
      protectManualCheckpoints: false,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    // Should remove oldest snapshots until under 150 MB
    // snap1 (60 MB) + snap2 (60 MB) = 120 MB, which is under 150 MB
    expect(toDelete).toHaveLength(2);
    expect(toDelete.map((s) => s.id)).toEqual(['snap1', 'snap2']);
  });

  it('applies combined policies correctly', () => {
    const snapshots = [
      createSnapshot('snap1', 'file.md', now - 86400 * 40, 50 * 1024 * 1024), // 40 days old, 50 MB
      createSnapshot('snap2', 'file.md', now - 86400 * 35, 50 * 1024 * 1024), // 35 days old, 50 MB
      createSnapshot('snap3', 'file.md', now - 86400 * 20, 50 * 1024 * 1024), // 20 days old, 50 MB
      createSnapshot('snap4', 'file.md', now - 86400 * 10, 50 * 1024 * 1024), // 10 days old, 50 MB
      createSnapshot('snap5', 'file.md', now, 50 * 1024 * 1024), // current, 50 MB
    ];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 3, // Keep max 3
      maxTotalStorageMb: 150, // Keep under 150 MB
      retentionDays: 30, // Keep only 30 days
      protectManualCheckpoints: false,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    // snap1 and snap2 are older than 30 days (age policy)
    // snap1, snap2, snap3 exceed maxSnapshotsPerFile=3 (count policy)
    // snap1, snap2, snap3, snap4 exceed 150 MB storage (size policy)
    // Combined: snap1 and snap2 should be deleted
    expect(toDelete).toHaveLength(2);
    expect(toDelete.map((s) => s.id)).toEqual(['snap1', 'snap2']);
  });

  it('returns empty list for empty snapshot array', () => {
    const snapshots: Snapshot[] = [];

    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: 100,
      maxTotalStorageMb: 200,
      retentionDays: 30,
      protectManualCheckpoints: true,
    };

    const toDelete = getSnapshotsToDelete(snapshots, policy, now);
    expect(toDelete).toHaveLength(0);
  });
});
