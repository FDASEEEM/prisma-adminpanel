import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateProfessorDto {
  @ApiPropertyOptional({ example: "user-123" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: "Juan Pérez" })
  @IsString()
  @MinLength(3)
  nombreCompleto!: string;

  @ApiProperty({ example: "juan.perez@prisma.edu" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "temp123456" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: "TEACHER", enum: ["TEACHER", "ADMIN", "SUPERADMIN"] })
  @IsOptional()
  @IsString()
  @IsIn(["TEACHER", "ADMIN", "SUPERADMIN"])
  role?: "TEACHER" | "ADMIN" | "SUPERADMIN";

  @ApiPropertyOptional({ example: "Matemáticas" })
  @IsOptional()
  @IsString()
  especialidad?: string;

  @ApiPropertyOptional({ example: "+56912345678" })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: "uuid-del-colegio" })
  @IsOptional()
  @IsUUID()
  colegioId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
