import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class UpdateBedStateDto {
  @IsNotEmpty()
  @IsUUID()
  bedId: string;

  @IsOptional()
  @IsIn(['Available', 'Occupied', 'Under Maintenance', 'Reserved'])
  status?: string;

  @IsOptional()
  @IsString()
  currentPatientId?: string | null;
}
