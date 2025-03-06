import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateConfigDto {
  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsNumber()
  @IsOptional()
  ticketCreateInterval?: number;

  @IsNumber()
  @IsOptional()
  ticketReplyInterval?: number;

  @IsNumber()
  @IsOptional()
  ticketsPerDay?: number;
}
