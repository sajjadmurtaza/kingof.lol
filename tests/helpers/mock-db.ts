import { vi } from "vitest";

/** Queue results consumed by each awaited Drizzle-style query chain. */
export function createMockDb() {
  const queue: unknown[] = [];

  function dequeue(): unknown {
    if (queue.length === 0) {
      throw new Error("Mock DB queue empty — enqueue a result before awaiting");
    }
    return queue.shift();
  }

  function buildChain(): Promise<unknown> & Record<string, unknown> {
    const chain: Record<string, unknown> = {};
    const chainMethods = [
      "select",
      "from",
      "innerJoin",
      "leftJoin",
      "where",
      "orderBy",
      "groupBy",
      "limit",
      "offset",
    ] as const;

    for (const method of chainMethods) {
      chain[method] = vi.fn(() => buildChain());
    }

    chain.then = (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(dequeue()).then(onFulfilled, onRejected);

    return chain as Promise<unknown> & Record<string, unknown>;
  }

  const db = {
    select: vi.fn(() => buildChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
      returning: vi.fn(() => buildChain()),
      onConflictDoUpdate: vi.fn(() => Promise.resolve()),
      then: (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(undefined).then(onFulfilled, onRejected),
    })),
    })),
    execute: vi.fn(async () => ({ rows: dequeue() as unknown[] })),
  };

  return {
    db,
    enqueue(...results: unknown[]) {
      queue.push(...results);
    },
    reset() {
      queue.length = 0;
      db.select.mockClear();
      db.insert.mockClear();
      db.execute.mockClear();
    },
    get execute() {
      return db.execute;
    },
  };
}
