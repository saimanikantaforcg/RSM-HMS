import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export type PharmacyDispenseStatus = 'Pending' | 'Dispensed';

@Entity('pharmacy_dispenses')
@Index(['tenantId', 'patientName'])
export class PharmacyDispense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', name: 'rx_reference', nullable: true })
  rxReference: string;

  /** FK to prescriptions.id — links this dispense to the original prescription */
  @Column({ type: 'varchar', name: 'prescription_id', nullable: true })
  prescriptionId: string;

  /** FK to prescription_items.id — links to the specific drug line dispensed */
  @Column({ type: 'varchar', name: 'prescription_item_id', nullable: true })
  prescriptionItemId: string;

  /** FK to patients.id */
  @Column({ type: 'varchar', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ name: 'patient_name' })
  patientName: string;

  @Column({ name: 'drug_name' })
  drugName: string;

  @Column()
  quantity: string;

  @Column({ type: 'varchar', default: 'Dispensed' })
  status: PharmacyDispenseStatus;

  @CreateDateColumn()
  dispensedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
