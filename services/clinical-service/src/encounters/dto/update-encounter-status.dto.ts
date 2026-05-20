import { IsEnum } from 'class-validator';
import type { EncounterStatus } from '../../entities/encounter.entity';

export class UpdateEncounterStatusDto {
  @IsEnum(
    ['Planned', 'Arrived', 'InProgress', 'AwaitingLab', 'AwaitingPayment', 'Admitted', 'Discharged', 'Cancelled'],
    { message: 'status must be a valid EncounterStatus value' },
  )
  status: EncounterStatus;
}
