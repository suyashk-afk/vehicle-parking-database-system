/**
 * ParkingRate model with validation and effective date handling
 */

import { v4 as uuidv4 } from 'uuid';
import { ParkingRate, VehicleType, RateType } from '../types';
import { 
  validateVehicleType, 
  validateRateType, 
  validatePositiveNumber, 
  validateDate,
  ValidationError 
} from '../utils/validation';

export class ParkingRateModel implements ParkingRate {
  public readonly rateId: string;
  public readonly vehicleType: VehicleType;
  public readonly rateType: RateType;
  public readonly amount: number;
  public readonly effectiveFrom: Date;
  public readonly effectiveUntil?: Date | undefined;
  public readonly createdAt: Date;

  constructor(
    vehicleType: VehicleType,
    rateType: RateType,
    amount: number,
    effectiveFrom?: Date,
    effectiveUntil?: Date,
    rateId?: string,
    createdAt?: Date
  ) {
    this.validateAndSetVehicleType(vehicleType);
    this.validateAndSetRateType(rateType);
    this.validateAndSetAmount(amount);
    this.validateAndSetEffectiveDates(effectiveFrom, effectiveUntil);
    
    this.rateId = rateId || uuidv4();
    this.vehicleType = vehicleType;
    this.rateType = rateType;
    this.amount = amount;
    this.effectiveFrom = effectiveFrom || new Date();
    this.effectiveUntil = effectiveUntil;
    this.createdAt = createdAt || new Date();
  }

  /**
   * Validates and sets vehicle type
   */
  private validateAndSetVehicleType(vehicleType: VehicleType): void {
    if (!validateVehicleType(vehicleType)) {
      throw new ValidationError(
        `Invalid vehicle type: ${vehicleType}. Must be one of: ${Object.values(VehicleType).join(', ')}`,
        'INVALID_VEHICLE_TYPE'
      );
    }
  }

  /**
   * Validates and sets rate type
   */
  private validateAndSetRateType(rateType: RateType): void {
    if (!validateRateType(rateType)) {
      throw new ValidationError(
        `Invalid rate type: ${rateType}. Must be one of: ${Object.values(RateType).join(', ')}`,
        'INVALID_RATE_TYPE'
      );
    }
  }

  /**
   * Validates and sets amount
   */
  private validateAndSetAmount(amount: number): void {
    if (!validatePositiveNumber(amount)) {
      throw new ValidationError(
        'Rate amount must be a positive number',
        'INVALID_RATE_AMOUNT'
      );
    }
  }

  /**
   * Validates effective date range
   */
  private validateAndSetEffectiveDates(effectiveFrom?: Date, effectiveUntil?: Date): void {
    const fromDate = effectiveFrom || new Date();
    
    if (!validateDate(fromDate)) {
      throw new ValidationError(
        'Effective from date must be a valid date',
        'INVALID_EFFECTIVE_FROM_DATE'
      );
    }

    if (effectiveUntil) {
      if (!validateDate(effectiveUntil)) {
        throw new ValidationError(
          'Effective until date must be a valid date',
          'INVALID_EFFECTIVE_UNTIL_DATE'
        );
      }

      if (effectiveUntil.getTime() <= fromDate.getTime()) {
        throw new ValidationError(
          'Effective until date must be after effective from date',
          'INVALID_EFFECTIVE_DATE_RANGE'
        );
      }
    }
  }

  /**
   * Checks if the rate is effective for a given date
   */
  isEffectiveOn(date: Date): boolean {
    if (!validateDate(date)) {
      return false;
    }

    const dateTime = date.getTime();
    const fromTime = this.effectiveFrom.getTime();
    
    // Check if date is after or equal to effective from
    if (dateTime < fromTime) {
      return false;
    }

    // Check if date is before effective until (if specified)
    if (this.effectiveUntil && dateTime >= this.effectiveUntil.getTime()) {
      return false;
    }

    return true;
  }

  /**
   * Checks if the rate is currently effective
   */
  isCurrentlyEffective(): boolean {
    return this.isEffectiveOn(new Date());
  }

  /**
   * Calculates fee based on duration and rate type
   */
  calculateFee(durationMinutes: number): number {
    if (durationMinutes <= 0) {
      return 0;
    }

    switch (this.rateType) {
      case RateType.FLAT:
        return this.amount;
      
      case RateType.HOURLY:
        const hours = Math.ceil(durationMinutes / 60);
        return hours * this.amount;
      
      case RateType.DAILY:
        const days = Math.ceil(durationMinutes / (24 * 60));
        return days * this.amount;
      
      default:
        throw new ValidationError(
          `Unsupported rate type: ${this.rateType}`,
          'UNSUPPORTED_RATE_TYPE'
        );
    }
  }

  /**
   * Creates a ParkingRate instance from plain object
   */
  static fromObject(obj: any): ParkingRateModel {
    if (!obj || typeof obj !== 'object') {
      throw new ValidationError('Parking rate data must be an object', 'INVALID_RATE_DATA');
    }

    const { 
      rateId, 
      vehicleType, 
      rateType, 
      amount, 
      effectiveFrom, 
      effectiveUntil, 
      createdAt 
    } = obj;

    if (!vehicleType) {
      throw new ValidationError('Vehicle type is required', 'MISSING_VEHICLE_TYPE');
    }

    if (!rateType) {
      throw new ValidationError('Rate type is required', 'MISSING_RATE_TYPE');
    }

    if (amount === undefined || amount === null) {
      throw new ValidationError('Rate amount is required', 'MISSING_RATE_AMOUNT');
    }

    return new ParkingRateModel(
      vehicleType,
      rateType,
      amount,
      effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveUntil ? new Date(effectiveUntil) : undefined,
      rateId,
      createdAt ? new Date(createdAt) : undefined
    );
  }

  /**
   * Converts to plain object for serialization
   */
  toObject(): ParkingRate {
    return {
      rateId: this.rateId,
      vehicleType: this.vehicleType,
      rateType: this.rateType,
      amount: this.amount,
      effectiveFrom: this.effectiveFrom,
      effectiveUntil: this.effectiveUntil,
      createdAt: this.createdAt
    };
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const until = this.effectiveUntil ? ` until ${this.effectiveUntil.toISOString()}` : ' (ongoing)';
    return `ParkingRate(${this.vehicleType}, ${this.rateType}, ₹${this.amount}, from ${this.effectiveFrom.toISOString()}${until})`;
  }
}