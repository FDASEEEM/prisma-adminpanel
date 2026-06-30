import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { UsersApiClient } from "./users-api.client";

describe("UsersApiClient", () => {
  let client: UsersApiClient;
  let originalFetch: typeof global.fetch;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersApiClient],
    }).compile();

    client = module.get<UsersApiClient>(UsersApiClient);
    originalFetch = global.fetch;
    originalEnv = process.env.USERS_SERVICE_URL;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.USERS_SERVICE_URL = originalEnv;
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(client).toBeDefined();
  });

  describe("getCurrentUser", () => {
    it("should throw if USERS_SERVICE_URL is not configured", async () => {
      delete process.env.USERS_SERVICE_URL;

      await expect(client.getCurrentUser("token")).rejects.toThrow(InternalServerErrorException);
    });

    it("should return profile on success", async () => {
      process.env.USERS_SERVICE_URL = "http://users";
      const profile = { id: "u1", role: "ADMIN" };
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(profile) });

      const result = await client.getCurrentUser("token");

      expect(global.fetch).toHaveBeenCalledWith("http://users/auth/me", { headers: { Authorization: "Bearer token" } });
      expect(result).toEqual(profile);
    });

    it("should throw when response not ok", async () => {
      process.env.USERS_SERVICE_URL = "http://users";
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: jest.fn() });

      await expect(client.getCurrentUser("token")).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("createProfessorUser", () => {
    it("should throw if USERS_SERVICE_URL is not configured", async () => {
      delete process.env.USERS_SERVICE_URL;

      await expect(client.createProfessorUser({ email: "p@p.com", nombreCompleto: "Prof", password: "pass" })).rejects.toThrow(InternalServerErrorException);
    });

    it("should create user on success", async () => {
      process.env.USERS_SERVICE_URL = "http://users";
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ ok: true, user: { id: "u1", email: "p@p.com" } }),
      });

      const result = await client.createProfessorUser({ email: "p@p.com", nombreCompleto: "Prof", password: "pass" }, "token");

      expect(global.fetch).toHaveBeenCalledWith("http://users/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
        body: JSON.stringify({ email: "p@p.com", nombreCompleto: "Prof", password: "pass", role: "TEACHER", colegioId: undefined }),
      });
      expect(result).toEqual({ id: "u1", email: "p@p.com" });
    });

    it("should throw when response not ok or data.ok is false", async () => {
      process.env.USERS_SERVICE_URL = "http://users";
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ ok: false, message: "Error creating" }),
      });

      await expect(client.createProfessorUser({ email: "p@p.com", nombreCompleto: "Prof", password: "pass" })).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("listUsers", () => {
    it("should throw if USERS_SERVICE_URL is not configured", async () => {
      delete process.env.USERS_SERVICE_URL;

      await expect(client.listUsers("token")).rejects.toThrow(InternalServerErrorException);
    });

    it("should return users on success", async () => {
      process.env.USERS_SERVICE_URL = "http://users";
      const users = [{ id: "u1", role: "ADMIN" }];
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(users) });

      const result = await client.listUsers("token");

      expect(global.fetch).toHaveBeenCalledWith("http://users/admin/users", { headers: { Authorization: "Bearer token" } });
      expect(result).toEqual(users);
    });

    it("should throw when response not ok", async () => {
      process.env.USERS_SERVICE_URL = "http://users";
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: jest.fn() });

      await expect(client.listUsers("token")).rejects.toThrow(InternalServerErrorException);
    });
  });
});
