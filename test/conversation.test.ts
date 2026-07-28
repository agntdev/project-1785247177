import { describe, expect, it } from "vitest";
import { expiredConversation, openConversation, setConversationClock } from "../src/conversation.js";
import type { Session } from "../src/bot.js";

describe("temporary conversation expiry", () => {
  it("expires after thirty minutes and opens a fresh session on the next interaction", () => {
    let current = 1_000;
    const restoreClock = setConversationClock(() => current);
    try {
      const session: Session = {};
      const first = openConversation(session, 42);
      current += 30 * 60_000;
      expect(expiredConversation(first)).toBe(true);

      const replacement = openConversation(session, 42);
      expect(replacement.id).not.toBe(first.id);
      expect(replacement.history).toEqual([]);
      expect(expiredConversation(replacement)).toBe(false);
    } finally {
      restoreClock();
    }
  });
});
