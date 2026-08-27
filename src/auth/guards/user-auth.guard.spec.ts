import { BadGatewayException, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { UserAuthGuard } from "./user-auth.guard";
import { UsersApiClient } from "../../infrastructure/users-api/users-api.client";

describe("UserAuthGuard", () => {
  const usersApiClient = { getCurrentUser: jest.fn() };
  const guard = new UserAuthGuard(usersApiClient as unknown as UsersApiClient);

  const buildContext = (headers: Record<string, string | undefined>) => {
    const request: Record<string, unknown> = { headers };
    return {
      ctx: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext,
      request,
    };
  };

  beforeEach(() => jest.clearAllMocks());

  it("rejects when the Authorization header is missing", async () => {
    const { ctx } = buildContext({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("attaches the resolved user to the request", async () => {
    usersApiClient.getCurrentUser.mockResolvedValue({ id: "u1", role: "TEACHER" });
    const { ctx, request } = buildContext({ authorization: "Bearer tok" });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(usersApiClient.getCurrentUser).toHaveBeenCalledWith("tok");
    expect((request as { user?: unknown }).user).toEqual({ id: "u1", role: "TEACHER" });
  });

  it("propagates the real error from the users service instead of masking it", async () => {
    usersApiClient.getCurrentUser.mockRejectedValue(new BadGatewayException("down"));
    const { ctx } = buildContext({ authorization: "Bearer tok" });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadGatewayException);
  });
});
