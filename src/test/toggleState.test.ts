import { describe, it, expect } from "vitest";
import { cyclePrefix } from "../toggleState";

describe("cyclePrefix", () => {
  it("cycles '- ' to '+ '", () => {
    expect(cyclePrefix("- todo item")).toBe("+ todo item");
  });

  it("cycles '+ ' to '-> '", () => {
    expect(cyclePrefix("+ done item")).toBe("-> done item");
  });

  it("cycles '-> ' to '-- '", () => {
    expect(cyclePrefix("-> outcome")).toBe("-- outcome");
  });

  it("cycles '-- ' back to '- '", () => {
    expect(cyclePrefix("-- comment")).toBe("- comment");
  });

  it("preserves leading whitespace", () => {
    expect(cyclePrefix("  - indented")).toBe("  + indented");
    expect(cyclePrefix("\t+ tabbed")).toBe("\t-> tabbed");
  });

  it("prepends '- ' to lines with no prefix", () => {
    expect(cyclePrefix("plain text")).toBe("- plain text");
    expect(cyclePrefix("  indented plain")).toBe("  - indented plain");
  });
});
