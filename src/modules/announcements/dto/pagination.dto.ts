import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "all" })
  @IsOptional()
  @IsIn(["all", "teachers", "admins"])
  audience?: string;
}
