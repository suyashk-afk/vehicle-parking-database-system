/**
 * ParkingSpace model with occupancy tracking
 */

import { ParkingSpace, SpaceType } from '../types';
import { validateSpaceType, validateNonEmptyString, ValidationError } from '../utils/validation';

export class ParkingSpaceModel implements ParkingSpace {
  public readonly spaceId: string;
  public readonly spaceType: SpaceType;
  public readonly zone: string;
  public isOccupied: boolean;
  public readonly createdAt: Date;

  constructor(
    spaceId: string,
    spaceType: SpaceType,
    zone: string,
    isOccupied: boolean = false,
    createdAt?: Date
  ) {
    this.validateAndSetSpaceId(spaceId);
    this.validateAndSetSpaceType(spaceType);
    this.validateAndSetZone(zone);
    
    this.spaceId = spaceId;
    this.spaceType = spaceType;
    this.zone = zone;
    this.isOccupied = isOccupied;
    this.createdAt = createdAt || new Date();
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
   * Validates and sets space type
   */
  private validateAndSetSpaceType(spaceType: SpaceType): void {
    if (!validateSpaceType(spaceType)) {
      throw new ValidationError(
        `Invalid space type: ${spaceType}. Must be one of: ${Object.values(SpaceType).join(', ')}`,
        'INVALID_SPACE_TYPE'
      );
    }
  }

  /**
   * Validates and sets zone
   */
  private validateAndSetZone(zone: string): void {
    if (!validateNonEmptyString(zone)) {
      throw new ValidationError(
        'Zone must be a non-empty string',
        'INVALID_ZONE'
      );
    }
  }

  /**
   * Occupies the parking space
   */
  occupy(): void {
    if (this.isOccupied) {
      throw new ValidationError(
        `Space ${this.spaceId} is already occupied`,
        'SPACE_ALREADY_OCCUPIED'
      );
    }
    this.isOccupied = true;
  }

  /**
   * Releases the parking space
   */
  release(): void {
    if (!this.isOccupied) {
      throw new ValidationError(
        `Space ${this.spaceId} is already available`,
        'SPACE_ALREADY_AVAILABLE'
      );
    }
    this.isOccupied = false;
  }

  /**
   * Checks if the space is available
   */
  isAvailable(): boolean {
    return !this.isOccupied;
  }

  /**
   * Checks if a vehicle type can use this space
   */
  canAccommodateVehicleType(vehicleType: string): boolean {
    // Handicap spaces can accommodate any vehicle type
    if (this.spaceType === SpaceType.HANDICAP) {
      return true;
    }

    // Direct match
    if (this.spaceType === vehicleType) {
      return true;
    }

    // Truck spaces can accommodate cars
    if (this.spaceType === SpaceType.TRUCK && vehicleType === 'CAR') {
      return true;
    }

    return false;
  }

  /**
   * Creates a ParkingSpace instance from plain object
   */
  static fromObject(obj: any): ParkingSpaceModel {
    if (!obj || typeof obj !== 'object') {
      throw new ValidationError('Parking space data must be an object', 'INVALID_SPACE_DATA');
    }

    const { spaceId, spaceType, zone, isOccupied, createdAt } = obj;

    if (!spaceId) {
      throw new ValidationError('Space ID is required', 'MISSING_SPACE_ID');
    }

    if (!spaceType) {
      throw new ValidationError('Space type is required', 'MISSING_SPACE_TYPE');
    }

    if (!zone) {
      throw new ValidationError('Zone is required', 'MISSING_ZONE');
    }

    return new ParkingSpaceModel(
      spaceId,
      spaceType,
      zone,
      Boolean(isOccupied),
      createdAt ? new Date(createdAt) : undefined
    );
  }

  /**
   * Converts to plain object for serialization
   */
  toObject(): ParkingSpace {
    return {
      spaceId: this.spaceId,
      spaceType: this.spaceType,
      zone: this.zone,
      isOccupied: this.isOccupied,
      createdAt: this.createdAt
    };
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const status = this.isOccupied ? 'OCCUPIED' : 'AVAILABLE';
    return `ParkingSpace(${this.spaceId}, ${this.spaceType}, ${this.zone}, ${status})`;
  }
}