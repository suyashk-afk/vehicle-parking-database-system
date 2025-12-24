/**
 * Validation utilities for the Vehicle Parking Database System
 */

import { VehicleType, SpaceType, RateType } from '../types';

export class ValidationError extends Error {
  constructor(message: string, public code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates license plate format
 * Accepts alphanumeric strings between 6-10 characters to support Indian license plates
 */
export function validateLicensePlate(licensePlate: string): boolean {
  if (!licensePlate || typeof licensePlate !== 'string') {
    return false;
  }
  
  // Remove spaces and convert to uppercase
  const cleaned = licensePlate.replace(/\s/g, '').toUpperCase();
  
  // Check length (6-10 characters to support Indian format)
  if (cleaned.length < 6 || cleaned.length > 10) {
    return false;
  }
  
  // Check for alphanumeric characters only
  const alphanumericRegex = /^[A-Z0-9]+$/;
  return alphanumericRegex.test(cleaned);
}

/**
 * Validates vehicle type against supported categories
 */
export function validateVehicleType(vehicleType: string): boolean {
  return Object.values(VehicleType).includes(vehicleType as VehicleType);
}

/**
 * Validates space type against supported categories
 */
export function validateSpaceType(spaceType: string): boolean {
  return Object.values(SpaceType).includes(spaceType as SpaceType);
}

/**
 * Validates rate type against supported categories
 */
export function validateRateType(rateType: string): boolean {
  return Object.values(RateType).includes(rateType as RateType);
}

/**
 * Validates timestamp chronological consistency
 */
export function validateTimestampOrder(entryTime: Date, exitTime: Date): boolean {
  return exitTime.getTime() > entryTime.getTime();
}

/**
 * Validates that a string is not empty or only whitespace
 */
export function validateNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a number is positive
 */
export function validatePositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validates that a date is valid
 */
export function validateDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Normalizes license plate format
 */
export function normalizeLicensePlate(licensePlate: string): string {
  if (!validateLicensePlate(licensePlate)) {
    throw new ValidationError(`Invalid license plate format: ${licensePlate}. Must be 6-10 alphanumeric characters.`, 'INVALID_LICENSE_PLATE');
  }
  return licensePlate.replace(/\s/g, '').toUpperCase();
}