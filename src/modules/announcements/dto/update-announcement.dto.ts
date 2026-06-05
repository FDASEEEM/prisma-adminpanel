import { ApiPropertyOptional } from "@nestjs/swagger";
import { AnnouncementAudience } from "@prisma/client";
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ example: "Mantenimiento actualizado" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: "Nuevo cuerpo del anuncio." })
  @IsOptional()
  @IsString()
  @MinLength(10)
  body?: string;

  @ApiPropertyOptional({ enum: ["all", "teachers", "admins"] })
  @IsOptional()
  @IsIn(["all", "teachers", "admins"])
  audience?: AnnouncementAudience;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "2026-06-01T22:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: "2026-06-01T23:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
