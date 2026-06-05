import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AnnouncementAudience } from "@prisma/client";
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAnnouncementDto {
  @ApiProperty({ example: "Mantenimiento programado" })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({ example: "El sistema no estará disponible de 22:00 a 23:00." })
  @IsString()
  @MinLength(10)
  body!: string;

  @ApiProperty({ enum: ["all", "teachers", "admins"] })
  @IsIn(["all", "teachers", "admins"])
  audience!: AnnouncementAudience;

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

  @ApiProperty({ example: "admin-user-1" })
  @IsString()
  createdBy!: string;
}
