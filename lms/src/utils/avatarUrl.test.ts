import {describe, expect, it} from "vitest";
import {normalizeAvatarUrl} from "./avatarUrl";

const apiOrigin = "https://lms.example.test";

describe("normalizeAvatarUrl", () => {
  it("rewrites backend avatar URLs to the configured deployment origin", () => {
    expect(normalizeAvatarUrl(
      "https://lms.example.test:8081/api/v2/users/385/avatar?v=c35afc09",
      apiOrigin,
    )).toBe(
      "https://lms.example.test/api/v2/users/385/avatar?v=c35afc09",
    );
  });

  it("resolves relative backend avatar paths", () => {
    expect(normalizeAvatarUrl("/api/v2/users/385/avatar?v=1", apiOrigin)).toBe(
      "https://lms.example.test/api/v2/users/385/avatar?v=1",
    );
  });

  it("does not rewrite an external avatar host", () => {
    const external = "https://images.example.com/avatar.png";
    expect(normalizeAvatarUrl(external, apiOrigin)).toBe(external);
  });

  it("preserves an absent avatar", () => {
    expect(normalizeAvatarUrl(null, apiOrigin)).toBeNull();
  });
});
