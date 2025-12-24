/**
 * Vehicle model with validation
 */

import { Vehicle, VehicleType } from '../types';
import { validateLicensePlate, validateVehicleType, normalizeLicensePlate, ValidationError } from '../utils/validation';

export class VehicleModel implements Vehicle {
  public readonly licensePlate: string;
  public readonly vehicleType: VehicleType;
  public readonly createdAt: Date;

  constructor(licensePlate: string, vehicleType: VehicleType, createdAt?: Date) {
    this.validateAndSetLicensePlate(licensePlate);
    this.validateAndSetVehicleType(vehicleType);
    this.licensePlate = normalizeLicensePlate(licensePlate);
    this.vehicleType = vehicleType;
    this.createdAt = createdAt || new Date();
  }

  /**
   * Validates and sets license plate
   */
  private validateAndSetLicensePlate(licensePlate: string): void {
    if (!validateLicensePlate(licensePlate)) {
      throw new ValidationError(
        `Invalid license plate format: ${licensePlate}. Must be 6-8 alphanumeric characters.`,
        'INVALID_LICENSE_PLATE'
      );
    }
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
   * Creates a Vehicle instance from plain object
   */
  static fromObject(obj: any): VehicleModel {
    if (!obj || typeof obj !== 'object') {
      throw new ValidationError('Vehicle data must be an object', 'INVALID_VEHICLE_DATA');
    }

    const { licensePlate, vehicleType, createdAt } = obj;

    if (!licensePlate) {
      throw new ValidationError('License plate is required', 'MISSING_LICENSE_PLATE');
    }

    if (!vehicleType) {
      throw new ValidationError('Vehicle type is required', 'MISSING_VEHICLE_TYPE');
    }

    return new VehicleModel(
      licensePlate,
      vehicleType,
      createdAt ? new Date(createdAt) : undefined
    );
  }

  /**
   * Converts to plain object for serialization
   */
  toObject(): Vehicle {
    return {
      licensePlate: this.licensePlate,
      vehicleType: this.vehicleType,
      createdAt: this.createdAt
    };
  }

  /**
   * Checks if this vehicle can use a specific space type
   */
  canUseSpaceType(spaceType: string): boolean {
    // Handicap spaces can be used by any vehicle type
    if (spaceType === 'HANDICAP') {
      return true;
    }

    // Direct match for vehicle type and space type
    if (this.vehicleType === spaceType) {
      return true;
    }

    // Cars can use truck spaces if needed
    if (this.vehicleType === VehicleType.CAR && spaceType === 'TRUCK') {
      return true;
    }

    return false;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return `Vehicle(${this.licensePlate}, ${this.vehicleType})`;
  }
}