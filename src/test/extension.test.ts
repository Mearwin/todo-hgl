import { describe, it, expect } from "vitest";
import { escape, buildRegex, findDecoration } from "../extension";

const TOKENS = ["- ", "+ ", "-> "];

describe("escape", () => {
  it("escapes regex special characters", () => {
    expect(escape("- ")).toBe("\\-\\ ");
    expect(escape("-> ")).toBe("\\->\\ ");
    expect(escape("+ ")).toBe("\\+\\ ");
  });

  it("escapes brackets and parens", () => {
    expect(escape("[test]")).toBe("\\[test\\]");
    expect(escape("(foo)")).toBe("\\(foo\\)");
  });
});

describe("buildRegex", () => {
  it("matches '- ' at line start", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("- todo item");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("- ");
  });

  it("matches '+ ' at line start", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("+ done item");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("+ ");
  });

  it("matches '-> ' at line start", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("-> outcome");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("-> ");
  });

  it("matches '--' (comment) at line start", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("-- comment");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("--");
  });

  it("matches tokens with leading indentation", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("  - indented todo");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("  - ");
  });

  it("matches tokens with tab indentation", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("\t-> tabbed outcome");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("\t-> ");
  });

  it("does not match tokens mid-line", () => {
    const regex = buildRegex(TOKENS);
    const match = regex.exec("hello - world");
    expect(match).toBeNull();
  });
});

describe("findDecoration", () => {
  it("returns 0 for todo token '- '", () => {
    expect(findDecoration("  - ", TOKENS)).toBe(0);
  });

  it("returns 1 for done token '+ '", () => {
    expect(findDecoration("  + ", TOKENS)).toBe(1);
  });

  it("returns 2 for outcome token '-> '", () => {
    expect(findDecoration("  -> ", TOKENS)).toBe(2);
  });

  it("does not match '-> ' as todo ('- ')", () => {
    expect(findDecoration("  -> ", TOKENS)).toBe(2);
    expect(findDecoration("  -> ", TOKENS)).not.toBe(0);
  });

  it("returns -1 for comment '--'", () => {
    expect(findDecoration("--", TOKENS)).toBe(-1);
  });
});
