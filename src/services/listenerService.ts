type Cleanup = () => void;

const activeCleanups = new Set<Cleanup>();

export function trackListener(cleanup: Cleanup): Cleanup {
  let active = true;
  const unsubscribe = () => {
    if (!active) {
      return;
    }
    active = false;
    activeCleanups.delete(unsubscribe);
    cleanup();
  };

  activeCleanups.add(unsubscribe);
  return unsubscribe;
}

export function unsubscribeAllListeners(): void {
  Array.from(activeCleanups).forEach(unsubscribe => unsubscribe());
}
