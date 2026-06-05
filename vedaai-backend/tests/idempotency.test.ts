import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { idempotencyMiddleware } from "../src/middleware/idempotency.middleware";
import * as idempotencyService from "../src/services/idempotency.service";

jest.mock("../src/services/idempotency.service");

describe("Idempotency Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn() as unknown as NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    jest.clearAllMocks();
  });

  it("should return 400 if X-Idempotency-Key is missing", async () => {
    await idempotencyMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "X-Idempotency-Key header is required",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should call next() if request is successfully locked", async () => {
    mockRequest.headers = { "x-idempotency-key": "test-key" };
    (idempotencyService.lockRequest as unknown as jest.Mock<any>).mockResolvedValue(true);

    await idempotencyMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(idempotencyService.lockRequest).toHaveBeenCalledWith("test-key");
    expect((mockRequest as Request).idempotencyKey).toBe("test-key");
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should return existing record if key is already locked", async () => {
    mockRequest.headers = { "x-idempotency-key": "test-key" };
    (idempotencyService.lockRequest as unknown as jest.Mock<any>).mockResolvedValue(false);
    (idempotencyService.getRecord as unknown as jest.Mock<any>).mockResolvedValue({
      assignmentId: "123",
      jobId: "456",
      status: "completed",
    });

    await idempotencyMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(idempotencyService.lockRequest).toHaveBeenCalledWith("test-key");
    expect(idempotencyService.getRecord).toHaveBeenCalledWith("test-key");
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Idempotent request detected",
      data: { _id: "123", status: "completed" },
      jobId: "456",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should return 409 if locked but record not found (race condition)", async () => {
    mockRequest.headers = { "x-idempotency-key": "test-key" };
    (idempotencyService.lockRequest as unknown as jest.Mock<any>).mockResolvedValue(false);
    (idempotencyService.getRecord as unknown as jest.Mock<any>).mockResolvedValue(null);

    await idempotencyMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Conflict, please retry.",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
