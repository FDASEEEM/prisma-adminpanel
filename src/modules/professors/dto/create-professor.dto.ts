import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

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

  @ApiPropertyOptional({ example: "Matemáticas" })
  @IsOptional()
  @IsString()
  especialidad?: string;

  @ApiPropertyOptional({ example: "+56912345678" })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
