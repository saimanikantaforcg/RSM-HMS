import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index
} from 'typeorm';

export type ConsentType =
  | 'treatment'          // Consent to receive medical treatment
  | 'data_sharing'       // Consent to share data with third parties (insurers, labs)
  | 'research'           // Consent to use anonymised data for research
  | 'marketing'          // Consent to receive health notifications/reminders
  | 'telemedicine'       // Consent to remote video consultation
  | 'abdm'               // Consent to link to ABDM/ABHA health record
  | 'data_retention';    // Consent to retain records beyond statutory minimum

export type ConsentStatus = 'granted' | 'withdrawn' | 'expired';

/**
 * PatientConsent — GDPR Article 7 / HIPAA § 164.508 compliance.
 *
 * Every time a patient grants or withdraws consent for a data-processing
 * activity, a new immutable row is inserted. The latest row per (patientId,
 * consentType) represents the current status.  Rows are never updated or
 * deleted — this gives a full, auditable consent history.
 */
@Entity('patient_consents')
@Index(['tenantId', 'patientId', 'consentType'])
export class PatientConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'patient_id' })
  @Index()
  patientId: string;

  /** The specific purpose the patient is consenting to / withdrawing from */
  @Column({ name: 'consent_type', type: 'varchar' })
  consentType: ConsentType;

  @Column({ type: 'varchar', default: 'granted' })
  status: ConsentStatus;

  /** ISO 8601 expiry — null means consent does not expire */
  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  /** Free-text description shown to patient at the point of consent */
  @Column({ name: 'consent_text', type: 'text', nullable: true })
  consentText: string | null;

  /** Version of the privacy policy / consent document the patient agreed to */
  @Column({ type: 'varchar', name: 'document_version', nullable: true })
  documentVersion: string | null;

  /** Who recorded the consent: patient self-service or staff-on-behalf */
  @Column({ type: 'varchar', name: 'recorded_by', nullable: true })
  recordedBy: string | null;

  /** IP address of the device that submitted consent (audit) */
  @Column({ type: 'varchar', name: 'ip_address', nullable: true })
  ipAddress: string | null;

  /** Immutable creation timestamp — serves as the consent timestamp */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
