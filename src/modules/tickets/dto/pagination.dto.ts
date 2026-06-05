import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: "Página" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20, description: "Items por página" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: "open", description: "Filtrar por estado" })
  @IsOptional()
  @IsIn(["open", "in_progress", "closed"])
  status?: string;

  @ApiPropertyOptional({ example: "user-123", description: "Filtrar por requester" })
  @IsOptional()
  @IsString()
  requesterId?: string;
}
