export class LLMTimeoutError extends Error {
  constructor(message = "LLM Generation timed out") {
    super(message);
    this.name = "LLMTimeoutError";
  }
}

export class QueueRetryError extends Error {
  constructor(message = "Queue job retrying") {
    super(message);
    this.name = "QueueRetryError";
  }
}
