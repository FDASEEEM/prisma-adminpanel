import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateProfessorDto {
  @ApiPropertyOptional({ example: "Juan Pérez actualizado" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombreCompleto?: string;

  @ApiPropertyOptional({ example: "juan.perez@prisma.edu" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "Física" })
  @IsOptional()
  @IsString()
  especialidad?: string;

  @ApiPropertyOptional({ example: "+56987654321" })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
