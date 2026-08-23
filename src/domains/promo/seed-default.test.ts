import { describe, it, expect, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";
import { ensureDefaultLaunchPromo } from "./seed-default";

const mock = createMockDb();

describe("ensureDefaultLaunchPromo", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("inserts missing launch promo codes", async () => {
    mock.enqueue([]);
    mock.enqueue([]);

    await ensureDefaultLaunchPromo(mock.db as never);

    expect(mock.db.insert).toHaveBeenCalledTimes(2);
  });

  it("skips codes that already exist", async () => {
    mock.enqueue([{ id: "promo-1" }]);
    mock.enqueue([{ id: "promo-2" }]);

    await ensureDefaultLaunchPromo(mock.db as never);

    expect(mock.db.insert).not.toHaveBeenCalled();
  });

  it("inserts only missing codes", async () => {
    mock.enqueue([{ id: "promo-1" }]);
    mock.enqueue([]);

    await ensureDefaultLaunchPromo(mock.db as never);

    expect(mock.db.insert).toHaveBeenCalledTimes(1);
  });
});
