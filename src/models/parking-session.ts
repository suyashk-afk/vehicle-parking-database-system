/**
 * ParkingSession model with timestamp validation
 */

import { v4 as uuidv4 } from 'uuid';
import { ParkingSession, SessionStatus } from '../types';
import { 
  validateLicensePlate, 
  validateNonEmptyString, 
  validateTimestampOrder, 
  validateDate,
  normalizeLicensePlate,
  ValidationError 
} from '../utils/validation';

export class ParkingSessionModel implements ParkingSession {
  public readonly sessionId: string;
  public readonly licensePlate: string;
  public readonly spaceId: string;
  public readonly entryTime: Date;
  public exitTime?: Date | undefined;
  public calculatedFee?: number | undefined;
  public status: SessionStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    licensePlate: string,
    spaceId: string,
    entryTime?: Date,
    sessionId?: string,
    exitTime?: Date,
    calculatedFee?: number,
    status: SessionStatus = SessionStatus.ACTIVE,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateAndSetLicensePlate(licensePlate);
    this.validateAndSetSpaceId(spaceId);
    this.validateAndSetEntryTime(entryTime);
    
    this.sessionId = sessionId || uuidv4();
    this.licensePlate = normalizeLicensePlate(licensePlate);
    this.spaceId = spaceId;
    this.entryTime = entryTime || new Date();
    this.exitTime = exitTime;
    this.calculatedFee = calculatedFee;
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();

    // Validate timestamp consistency if exit time is provided
    if (this.exitTime) {
      this.validateTimestampConsistency();
    }
  }

  /**
   * Validates and sets license plate
   */
  private validateAndSetLicensePlate(licensePlate: string): void {
    if (!validateLicensePlate(licensePlate)) {
      throw new ValidationError(
        `Invalid license plate format: ${licensePlate}`,
        'INVALID_LICENSE_PLATE'
      );
    }
  }

  /**
   * Validates and sets space ID
   */
  private validateAndSetSpaceId(spaceId: string): void {
    if (!validateNonEmptyString(spaceId)) {
      throw new ValidationError(
        'Space ID must be a non-empty string',
        'INVALID_SPACE_ID'
      );
    }
  }

  /**
   * Validates and sets entry time
   */
  private validateAndSetEntryTime(entryTime?: Date): void {
    const timeToValidate = entryTime || new Date();
    if (!validateDate(timeToValidate)) {
      throw new ValidationError(
        'Entry time must be a valid date',
        'INVALID_ENTRY_TIME'
      );
    }
  }

  /**
   * Validates timestamp chronological consistency
   */
  private validateTimestampConsistency(): void {
    if (this.exitTime && !validateTimestampOrder(this.entryTime, this.exitTime)) {
      throw new ValidationError(
        'Exit time must be after entry time',
        'INVALID_TIMESTAMP_ORDER'
      );
    }
  }

  /**
   * Completes the parking session with exit time and fee
   */
  complete(exitTime: Date, calculatedFee: number): void {
    if (this.status === SessionStatus.COMPLETED) {
      throw new ValidationError(
        `Session ${this.sessionId} is already completed`,
        'SESSION_ALREADY_COMPLETED'
      );
    }

    if (!validateDate(exitTime)) {
      throw new ValidationError(
        'Exit time must be a valid date',
        'INVALID_EXIT_TIME'
      );
    }

    if (!validateTimestampOrder(this.entryTime, exitTime)) {
      throw new ValidationError(
        'Exit time must be after entry time',
        'INVALID_TIMESTAMP_ORDER'
      );
    }

    if (typeof calculatedFee !== 'number' || calculatedFee < 0) {
      throw new ValidationError(
        'Calculated fee must be a non-negative number',
        'INVALID_FEE'
      );
    }

    this.exitTime = exitTime;
    this.calculatedFee = calculatedFee;
    this.status = SessionStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  /**
   * Cancels the parking session
   */
  cancel(): void {
    if (this.status === SessionStatus.COMPLETED) {
      throw new ValidationError(
        `Cannot cancel completed session ${this.sessionId}`,
        'CANNOT_CANCEL_COMPLETED_SESSION'
      );
    }

    this.status = SessionStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Calculates parking duration in minutes
   */
  getDurationMinutes(): number {
    const endTime = this.exitTime || new Date();
    return Math.ceil((endTime.getTime() - this.entryTime.getTime()) / (1000 * 60));
  }

  /**
   * Calculates parking duration in hours
   */
  getDurationHours(): number {
    return Math.ceil(this.getDurationMinutes() / 60);
  }

  /**
   * Checks if the session is active
   */
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  /**
   * Checks if the session is completed
   */
  isCompleted(): boolean {
    return this.status === SessionStatus.COMPLETED;
  }

  /**
   * Creates a ParkingSession instance from plain object
   */
  static fromObject(obj: any): ParkingSessionModel {
    if (!obj || typeof obj !== 'object') {
      throw new ValidationError('Parking session data must be an object', 'INVALID_SESSION_DATA');
    }

    const { 
      sessionId, 
      licensePlate, 
      spaceId, 
      entryTime, 
      exitTime, 
      calculatedFee, 
      status, 
      createdAt, 
      updatedAt 
    } = obj;

    if (!licensePlate) {
      throw new ValidationError('License plate is required', 'MISSING_LICENSE_PLATE');
    }

    if (!spaceId) {
      throw new ValidationError('Space ID is required', 'MISSING_SPACE_ID');
    }

    return new ParkingSessionModel(
      licensePlate,
      spaceId,
      entryTime ? new Date(entryTime) : undefined,
      sessionId,
      exitTime ? new Date(exitTime) : undefined,
      calculatedFee,
      status || SessionStatus.ACTIVE,
      createdAt ? new Date(createdAt) : undefined,
      updatedAt ? new Date(updatedAt) : undefined
    );
  }

  /**
   * Converts to plain object for serialization
   */
  toObject(): ParkingSession {
    return {
      sessionId: this.sessionId,
      licensePlate: this.licensePlate,
      spaceId: this.spaceId,
      entryTime: this.entryTime,
      exitTime: this.exitTime,
      calculatedFee: this.calculatedFee,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const duration = this.exitTime ? ` (${this.getDurationMinutes()}min)` : ' (ongoing)';
    return `ParkingSession(${this.sessionId}, ${this.licensePlate}, ${this.status}${duration})`;
  }
}