import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResourceType } from "@prisma/client";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateResourceDto {
  @ApiProperty({ example: "Guía de fracciones" })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional({ example: "Material para clases de matemáticas." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ["file", "link", "video", "document"] })
  @IsIn(["file", "link", "video", "document"])
  type!: ResourceType;

  @ApiProperty({ example: "https://cdn.prisma.local/resources/fracciones.pdf" })
  @IsString()
  url!: string;

  @ApiProperty({ example: "admin-user-1" })
  @IsString()
  uploadedBy!: string;
}
