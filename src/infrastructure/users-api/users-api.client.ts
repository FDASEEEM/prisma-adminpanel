import { Injectable, InternalServerErrorException } from "@nestjs/common";

export type AdminProfile = {
  id: string;
  email?: string;
  role: "SUPERADMIN" | "ADMIN" | "TEACHER";
  nombreCompleto?: string;
  colegioId?: string | null;
};

export type CreateProfessorUserDto = {
  email: string;
  nombreCompleto: string;
  password: string;
  role?: "TEACHER" | "ADMIN" | "SUPERADMIN";
  colegioId?: string;
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

  async createProfessorUser(dto: CreateProfessorUserDto, accessToken?: string): Promise<{ id: string; email: string }> {
    const baseUrl = process.env.USERS_SERVICE_URL;
    if (!baseUrl) {
      throw new InternalServerErrorException("USERS_SERVICE_URL is required.");
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${baseUrl}/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: dto.email, nombreCompleto: dto.nombreCompleto, password: dto.password, role: dto.role ?? "TEACHER", colegioId: dto.colegioId }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new InternalServerErrorException(data.message || "Could not create professor user in users service.");
    }
    return { id: data.user.id, email: data.user.email };
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
