import { ApiPropertyOptional } from "@nestjs/swagger";
import { TicketStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: ["open", "in_progress", "closed"] })
  @IsOptional()
  @IsIn(["open", "in_progress", "closed"])
  status?: TicketStatus;

  @ApiPropertyOptional({ example: "admin-user-1" })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: "Respuesta del administrador" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  message?: string;
}
