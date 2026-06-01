import { ApiPropertyOptional } from "@nestjs/swagger";
import { ResourceType } from "@prisma/client";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateResourceDto {
  @ApiPropertyOptional({ example: "Guía de fracciones actualizada" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: "Material para clases de matemáticas." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ["file", "link", "video", "document"] })
  @IsOptional()
  @IsIn(["file", "link", "video", "document"])
  type?: ResourceType;

  @ApiPropertyOptional({ example: "https://cdn.prisma.local/resources/fracciones-v2.pdf" })
  @IsOptional()
  @IsString()
  url?: string;
}
