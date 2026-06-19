import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { JobsApiClient } from "./jobs-api.client";

describe("JobsApiClient", () => {
  let client: JobsApiClient;
  let originalFetch: typeof global.fetch;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsApiClient],
    }).compile();

    client = module.get<JobsApiClient>(JobsApiClient);
    originalFetch = global.fetch;
    originalEnv = process.env.DOCS_SERVICE_URL;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.DOCS_SERVICE_URL = originalEnv;
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(client).toBeDefined();
  });

  describe("getColegioStats", () => {
    it("should throw if DOCS_SERVICE_URL is not configured", async () => {
      delete process.env.DOCS_SERVICE_URL;

      await expect(client.getColegioStats("c1")).rejects.toThrow(InternalServerErrorException);
    });

    it("should return stats on success", async () => {
      process.env.DOCS_SERVICE_URL = "http://docs";
      const stats = { totalJobs: 1, completedJobs: 1, failedJobs: 0, pendingJobs: 0, processingJobs: 0 };
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(stats) });

      const result = await client.getColegioStats("c1");

      expect(global.fetch).toHaveBeenCalledWith("http://docs/api/jobs/colegio/c1/stats", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(stats);
    });

    it("should throw when response not ok", async () => {
      process.env.DOCS_SERVICE_URL = "http://docs";
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: "Bad Gateway", json: jest.fn() });

      await expect(client.getColegioStats("c1")).rejects.toThrow(InternalServerErrorException);
    });
  });
});
