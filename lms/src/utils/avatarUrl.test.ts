import {describe, expect, it} from "vitest";
import {normalizeAvatarUrl} from "./avatarUrl";

const devOrigin = "https://dev.xlearnedu.com:8081";

describe("normalizeAvatarUrl", () => {
  it("adds the configured 8081 port to backend avatar URLs", () => {
    expect(normalizeAvatarUrl(
      "https://dev.xlearnedu.com/api/v2/users/385/avatar?v=c35afc09",
      devOrigin,
    )).toBe(
      "https://dev.xlearnedu.com:8081/api/v2/users/385/avatar?v=c35afc09",
    );
  });

  it("resolves relative backend avatar paths", () => {
    expect(normalizeAvatarUrl("/api/v2/users/385/avatar?v=1", devOrigin)).toBe(
      "https://dev.xlearnedu.com:8081/api/v2/users/385/avatar?v=1",
    );
  });

  it("does not rewrite an external avatar host", () => {
    const external = "https://images.example.com/avatar.png";
    expect(normalizeAvatarUrl(external, devOrigin)).toBe(external);
  });

  it("preserves an absent avatar", () => {
    expect(normalizeAvatarUrl(null, devOrigin)).toBeNull();
  });
});
