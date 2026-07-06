import { describe, it, expect } from "vitest";
import { classifyModel } from "./models";

describe("classifyModel", () => {
  it("classifies tier ids", () => {
    expect(classifyModel("chatgpt_pro")).toBe("frontier");
    expect(classifyModel("claude_max")).toBe("large");
  });

  it("classifies small models (mini/flash/haiku/nano)", () => {
    expect(classifyModel("gpt-4o-mini")).toBe("small");
    expect(classifyModel("gemini-2.0-flash")).toBe("small");
    expect(classifyModel("claude-3-5-haiku-20241022")).toBe("small");
    expect(classifyModel("gpt-4.1-nano")).toBe("small");
    expect(classifyModel("llama-3.1-8b-instant")).toBe("small");
  });

  it("classifies frontier reasoning models", () => {
    expect(classifyModel("o1-preview")).toBe("frontier");
    expect(classifyModel("o3")).toBe("frontier");
    expect(classifyModel("deep-research")).toBe("frontier");
  });

  it("classifies large models", () => {
    expect(classifyModel("claude-opus-4-8")).toBe("large");
    expect(classifyModel("gpt-4-turbo")).toBe("large");
    expect(classifyModel("llama-3.1-405b")).toBe("large");
  });

  it("classifies medium models", () => {
    expect(classifyModel("gpt-4o")).toBe("medium");
    expect(classifyModel("claude-sonnet-4-6")).toBe("medium");
    expect(classifyModel("gemini-1.5-pro")).toBe("medium");
    expect(classifyModel("deepseek-chat")).toBe("medium");
  });

  it("small beats frontier/large when both match (pattern order)", () => {
    // "mini" pattern is checked before the o1/o3 pattern
    expect(classifyModel("o4-mini")).toBe("small");
  });

  it("falls back to medium for unknown strings", () => {
    expect(classifyModel("totally-unknown-model")).toBe("medium");
    expect(classifyModel("")).toBe("medium");
    expect(classifyModel("manual")).toBe("medium");
  });
});
