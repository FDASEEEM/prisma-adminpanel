import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateSessionDto {
  @ApiProperty({ example: "user-123" })
  @IsString()
  userId!: string;

  @ApiProperty({ example: "hashed-token-value" })
  @IsString()
  tokenHash!: string;

  @ApiPropertyOptional({ example: "Mozilla/5.0" })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: "192.168.1.100" })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ example: "2026-06-02T10:00:00.000Z" })
  @IsDateString()
  expiresAt!: string;
}
