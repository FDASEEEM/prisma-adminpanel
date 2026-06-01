import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTicketDto {
  @ApiProperty({ example: "user-123" })
  @IsString()
  requesterId!: string;

  @ApiProperty({ example: "Error al generar PDF" })
  @IsString()
  @MinLength(3)
  subject!: string;

  @ApiProperty({ example: "El sistema arroja error 500" })
  @IsString()
  @MinLength(10)
  message!: string;

  @ApiPropertyOptional({ enum: ["open", "in_progress", "closed"] })
  @IsOptional()
  @IsIn(["open", "in_progress", "closed"])
  status?: TicketStatus;

  @ApiPropertyOptional({ example: "admin-user-1" })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
