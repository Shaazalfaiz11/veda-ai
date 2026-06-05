import { jest, expect, describe, it, beforeEach, afterEach } from "@jest/globals";
import { generateWithAI } from "../src/services/ai.service";
import { LLMTimeoutError } from "../src/utils/errors";
import OpenAI from "openai";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn((options: any, reqOptions: any) => {
          return new Promise((resolve, reject) => {
            const signal = reqOptions?.signal;
            if (signal) {
              signal.addEventListener("abort", () => {
                const err = new Error("The operation was aborted.");
                err.name = "AbortError";
                reject(err);
              });
            }
            // we don't resolve immediately to simulate a long running request
          });
        }),
      },
    },
  }));
});

describe("AI Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throw LLMTimeoutError if generation takes 30 seconds", async () => {
    const promise = generateWithAI("test prompt");
    
    // Advance timers by exactly 30000ms to trigger the abort controller
    jest.advanceTimersByTime(30000);

    await expect(promise).rejects.toThrow(LLMTimeoutError);
  });
});
