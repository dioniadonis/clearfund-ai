import { describe, expect, it } from "bun:test";
import { oauthReturnPath } from "../src/lib/oauth-return-path";

describe("OAuth login return path", () => {
  it("preserves the complete consent request", () => {
    const path = "/.lovable/oauth/consent?authorization_id=abc%20123#review";
    expect(oauthReturnPath(path)).toBe(path);
  });

  it("rejects external and network-path redirects", () => {
    expect(oauthReturnPath("https://outside.invalid/steal")).toBe("/");
    expect(oauthReturnPath("//outside.invalid/steal")).toBe("/");
    expect(oauthReturnPath("/\\outside.invalid/steal")).toBe("/");
  });

  it("rejects malformed and non-string values", () => {
    expect(oauthReturnPath("not-a-path")).toBe("/");
    expect(oauthReturnPath(null)).toBe("/");
    expect(oauthReturnPath("/%E0%A4%A")).toBe("/");
  });
});
