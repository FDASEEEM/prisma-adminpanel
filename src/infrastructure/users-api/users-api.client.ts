import { Injectable, InternalServerErrorException } from "@nestjs/common";

export type AdminProfile = {
  id: string;
  email?: string;
  role: "ADMIN" | "TEACHER";
  nombreCompleto?: string;
};

export type CreateProfessorUserDto = {
  email: string;
  nombreCompleto: string;
  password: string;
  role?: "TEACHER" | "ADMIN";
};

@Injectable()
export class UsersApiClient {
  async getCurrentUser(accessToken: string): Promise<AdminProfile> {
    const baseUrl = process.env.USERS_SERVICE_URL;
    if (!baseUrl) {
      throw new InternalServerErrorException("USERS_SERVICE_URL is required.");
    }
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new InternalServerErrorException("Could not validate admin profile.");
    }
    return (await response.json()) as AdminProfile;
  }

  async createProfessorUser(dto: CreateProfessorUserDto): Promise<{ id: string; email: string }> {
    const baseUrl = process.env.USERS_SERVICE_URL;
    if (!baseUrl) {
      throw new InternalServerErrorException("USERS_SERVICE_URL is required.");
    }
    const response = await fetch(`${baseUrl}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: dto.email, nombreCompleto: dto.nombreCompleto, password: dto.password, role: dto.role ?? "TEACHER" }),
    });
    if (!response.ok) {
      throw new InternalServerErrorException("Could not create professor user in users service.");
    }
    return (await response.json()) as { id: string; email: string };
  }

  async listUsers(accessToken: string): Promise<AdminProfile[]> {
    const baseUrl = process.env.USERS_SERVICE_URL;
    if (!baseUrl) {
      throw new InternalServerErrorException("USERS_SERVICE_URL is required.");
    }
    const response = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new InternalServerErrorException("Could not list users from users service.");
    }
    return (await response.json()) as AdminProfile[];
  }
}
