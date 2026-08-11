import { describe, it, expect } from "vitest";

import {
  ASPECT_RATIOS,
  BACKGROUND_COLORS,
  truncateText,
  getBackgroundColor,
  parseBackgroundConfig,
  parseArgs,
} from "../src/index";

describe("ASPECT_RATIOS", () => {
  it("exposes the five canonical social ratios", () => {
    // JS string sort: "16:9" < "1:1" because '6' (0x36) < ':' (0x3A).
    expect(Object.keys(ASPECT_RATIOS).sort()).toEqual([
      "16:9",
      "1:1",
      "4:5",
      "9:16",
      "original",
    ]);
  });

  it("defines platform-correct target dimensions", () => {
    expect(ASPECT_RATIOS["1:1"]).toMatchObject({ width: 1080, height: 1080 });
    expect(ASPECT_RATIOS["4:5"]).toMatchObject({ width: 1080, height: 1350 });
    expect(ASPECT_RATIOS["9:16"]).toMatchObject({ width: 1080, height: 1920 });
    expect(ASPECT_RATIOS["16:9"]).toMatchObject({ width: 1920, height: 1080 });
    expect(ASPECT_RATIOS["original"]).toMatchObject({ width: 0, height: 0 });
  });

  it("maps every ratio to at least one target platform", () => {
    for (const [ratio, config] of Object.entries(ASPECT_RATIOS)) {
      expect(config.platforms.length, `${ratio} has platforms`).toBeGreaterThan(0);
    }
  });
});

describe("BACKGROUND_COLORS", () => {
  it("has unique, non-empty color names", () => {
    const names = BACKGROUND_COLORS.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of BACKGROUND_COLORS) {
      expect(c.name.length).toBeGreaterThan(0);
    }
  });

  it("keeps hex and rgb representations in agreement", () => {
    for (const c of BACKGROUND_COLORS) {
      const hex = c.hex.replace("#", "");
      expect(hex).toMatch(/^[0-9A-F]{6}$/i);
      const fromHex = [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
      expect(c.rgb).toEqual(fromHex);
    }
  });
});

describe("truncateText", () => {
  it("returns short text unchanged", () => {
    expect(truncateText("hello")).toBe("hello");
  });

  it("returns text at the limit unchanged", () => {
    const text = "x".repeat(500);
    expect(truncateText(text)).toBe(text);
  });

  it("truncates over-limit text and reports the original length", () => {
    const text = "x".repeat(600);
    const out = truncateText(text);
    expect(out.length).toBeLessThan(text.length);
    expect(out).toContain("(truncated, 600 chars total)");
  });

  it("honours a custom max length", () => {
    const out = truncateText("abcdef", 3);
    expect(out.startsWith("abc")).toBe(true);
    expect(out).toContain("(truncated, 6 chars total)");
  });
});

describe("getBackgroundColor", () => {
  it("resolves a known color by name", () => {
    expect(getBackgroundColor("white").hex).toBe("#FFFFFF");
    expect(getBackgroundColor("pink").hex).toBe("#C2185B");
  });

  it("throws a helpful error for unknown colors", () => {
    expect(() => getBackgroundColor("chartreuse")).toThrow(/Invalid background color: chartreuse/);
  });
});

describe("parseBackgroundConfig", () => {
  it("defaults to white when no background is given", () => {
    expect(parseBackgroundConfig("", "false", "medium")).toEqual({
      type: "color",
      color: expect.objectContaining({ name: "white" }),
    });
  });

  it("resolves an explicit background color", () => {
    expect(parseBackgroundConfig("light-blue", "false", "medium")).toEqual({
      type: "color",
      color: expect.objectContaining({ name: "light-blue" }),
    });
  });

  it("rejects invalid background colors", () => {
    expect(() => parseBackgroundConfig("mauve", "false", "medium")).toThrow(/Invalid background color/);
  });
});

describe("parseArgs", () => {
  it("defaults to the list command", () => {
    expect(parseArgs([])).toEqual({ command: "list", params: {} });
  });

  it("captures a positional template id", () => {
    expect(parseArgs(["view", "61579"]).params.id).toBe("61579");
  });

  it("parses kebab-case flags into camelCase params", () => {
    const { command, params } = parseArgs([
      "carousel", "61579", "--text0", "hi", "--aspect-ratio", "1:1",
    ]);
    expect(command).toBe("carousel");
    expect(params.text0).toBe("hi");
    expect(params.aspectRatio).toBe("1:1");
  });

  it("keeps --help as an always-allowed flag", () => {
    const { params } = parseArgs(["generate", "--help"]);
    expect(params.help).toBe("true");
  });

  it("routes `help <command>` to the targeted help page", () => {
    const { command, params } = parseArgs(["help", "view"]);
    expect(command).toBe("help");
    expect(params.helpTarget).toBe("view");
  });
});
