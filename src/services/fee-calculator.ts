/**
 * FeeCalculator service for parking fee calculation
 */

import { IFeeCalculator, IParkingRateRepository } from '../models/interfaces';
import { ParkingRate, VehicleType, RateType } from '../types';
import { ValidationError } from '../utils/validation';

export class FeeCalculator implements IFeeCalculator {
  constructor(private rateRepository: IParkingRateRepository) {}

  /**
   * Calculates parking fee based on entry/exit times and vehicle type
   */
  async calculateFee(entryTime: Date, exitTime: Date, vehicleType: VehicleType): Promise<number> {
    try {
      // Validate input parameters
      this.validateCalculationInputs(entryTime, exitTime, vehicleType);

      // Calculate parking duration in minutes
      const durationMinutes = this.calculateDurationMinutes(entryTime, exitTime);
      
      if (durationMinutes <= 0) {
        return 0; // No charge for zero or negative duration
      }

      // Get the best applicable rate for this vehicle type and duration
      const rate = await this.getBestApplicableRate(vehicleType, durationMinutes, entryTime);
      
      if (!rate) {
        throw new ValidationError(
          `No parking rate found for vehicle type ${vehicleType}`,
          'NO_RATE_FOUND'
        );
      }

      // Calculate fee based on rate type
      return this.calculateFeeByRateType(rate, durationMinutes);

    } catch (error) {
      throw new ValidationError(
        `Fee calculation failed: ${error}`,
        'FEE_CALCULATION_ERROR'
      );
    }
  }

  /**
   * Updates parking rates
   */
  async updateRates(rates: ParkingRate[]): Promise<void> {
    try {
      for (const rate of rates) {
        this.validateRate(rate);
        
        // Check if rate already exists
        const existingRate = await this.rateRepository.findByVehicleAndRateType(
          rate.vehicleType, 
          rate.rateType, 
          rate.effectiveFrom
        );

        if (existingRate) {
          await this.rateRepository.update(rate);
        } else {
          await this.rateRepository.create(rate);
        }
      }
    } catch (error) {
      throw new ValidationError(
        `Rate update failed: ${error}`,
        'RATE_UPDATE_ERROR'
      );
    }
  }

  /**
   * Gets current rate structure
   */
  async getRateStructure(): Promise<ParkingRate[]> {
    try {
      return await this.rateRepository.findCurrentRates();
    } catch (error) {
      throw new ValidationError(
        `Failed to get rate structure: ${error}`,
        'RATE_STRUCTURE_ERROR'
      );
    }
  }

  /**
   * Validates a parking rate
   */
  validateRate(rate: ParkingRate): boolean {
    try {
      // Check required fields
      if (!rate.rateId || !rate.vehicleType || !rate.rateType || !rate.effectiveFrom) {
        throw new ValidationError('Missing required rate fields', 'INVALID_RATE_DATA');
      }

      // Validate amount is positive
      if (rate.amount <= 0) {
        throw new ValidationError('Rate amount must be positive', 'INVALID_RATE_AMOUNT');
      }

      // Validate vehicle type
      if (!Object.values(VehicleType).includes(rate.vehicleType)) {
        throw new ValidationError(`Invalid vehicle type: ${rate.vehicleType}`, 'INVALID_VEHICLE_TYPE');
      }

      // Validate rate type
      if (!Object.values(RateType).includes(rate.rateType)) {
        throw new ValidationError(`Invalid rate type: ${rate.rateType}`, 'INVALID_RATE_TYPE');
      }

      // Validate effective date range
      if (rate.effectiveUntil && rate.effectiveUntil <= rate.effectiveFrom) {
        throw new ValidationError('Effective until must be after effective from', 'INVALID_DATE_RANGE');
      }

      return true;
    } catch (error) {
      throw new ValidationError(
        `Rate validation failed: ${error}`,
        'RATE_VALIDATION_ERROR'
      );
    }
  }

  /**
   * Gets the best rate for a vehicle type and duration
   */
  async getBestRate(vehicleType: VehicleType, durationMinutes: number, effectiveDate?: Date): Promise<ParkingRate | null> {
    try {
      return await this.rateRepository.getBestRate(vehicleType, durationMinutes, effectiveDate);
    } catch (error) {
      throw new ValidationError(
        `Failed to get best rate: ${error}`,
        'BEST_RATE_ERROR'
      );
    }
  }

  /**
   * Calculates fee for a specific rate and duration
   */
  calculateFeeForRate(rate: ParkingRate, durationMinutes: number): number {
    return this.calculateFeeByRateType(rate, durationMinutes);
  }

  /**
   * Validates calculation inputs
   */
  private validateCalculationInputs(entryTime: Date, exitTime: Date, vehicleType: VehicleType): void {
    if (!(entryTime instanceof Date) || isNaN(entryTime.getTime())) {
      throw new ValidationError('Entry time must be a valid date', 'INVALID_ENTRY_TIME');
    }

    if (!(exitTime instanceof Date) || isNaN(exitTime.getTime())) {
      throw new ValidationError('Exit time must be a valid date', 'INVALID_EXIT_TIME');
    }

    if (exitTime <= entryTime) {
      throw new ValidationError('Exit time must be after entry time', 'INVALID_TIME_ORDER');
    }

    if (!Object.values(VehicleType).includes(vehicleType)) {
      throw new ValidationError(`Invalid vehicle type: ${vehicleType}`, 'INVALID_VEHICLE_TYPE');
    }
  }

  /**
   * Calculates duration in minutes between two dates
   */
  private calculateDurationMinutes(entryTime: Date, exitTime: Date): number {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    return Math.ceil(durationMs / (1000 * 60)); // Round up to next minute
  }

  /**
   * Gets the best applicable rate for vehicle type and duration
   */
  private async getBestApplicableRate(vehicleType: VehicleType, durationMinutes: number, effectiveDate: Date): Promise<ParkingRate | null> {
    // Get all current rates for this vehicle type
    const allRates = await this.rateRepository.findAll();
    const applicableRates = allRates.filter(rate => 
      rate.vehicleType === vehicleType && 
      this.isRateEffective(rate, effectiveDate)
    );

    if (applicableRates.length === 0) {
      return null;
    }

    // Find the rate that gives the lowest cost for this duration
    let bestRate: ParkingRate | null = null;
    let lowestCost = Infinity;

    for (const rate of applicableRates) {
      const cost = this.calculateFeeByRateType(rate, durationMinutes);
      if (cost < lowestCost) {
        lowestCost = cost;
        bestRate = rate;
      }
    }

    return bestRate;
  }

  /**
   * Checks if a rate is effective on a given date
   */
  private isRateEffective(rate: ParkingRate, date: Date): boolean {
    const dateTime = date.getTime();
    const fromTime = rate.effectiveFrom.getTime();
    
    if (dateTime < fromTime) {
      return false;
    }

    if (rate.effectiveUntil && dateTime >= rate.effectiveUntil.getTime()) {
      return false;
    }

    return true;
  }

  /**
   * Calculates fee based on rate type and duration
   */
  private calculateFeeByRateType(rate: ParkingRate, durationMinutes: number): number {
    switch (rate.rateType) {
      case RateType.FLAT:
        return rate.amount;
      
      case RateType.HOURLY:
        const hours = Math.ceil(durationMinutes / 60);
        return hours * rate.amount;
      
      case RateType.DAILY:
        const days = Math.ceil(durationMinutes / (24 * 60));
        return days * rate.amount;
      
      default:
        throw new ValidationError(
          `Unsupported rate type: ${rate.rateType}`,
          'UNSUPPORTED_RATE_TYPE'
        );
    }
  }

  /**
   * Estimates fee for a given duration without requiring exit time
   */
  async estimateFee(vehicleType: VehicleType, durationMinutes: number): Promise<number> {
    try {
      const rate = await this.getBestApplicableRate(vehicleType, durationMinutes, new Date());
      
      if (!rate) {
        throw new ValidationError(
          `No parking rate found for vehicle type ${vehicleType}`,
          'NO_RATE_FOUND'
        );
      }

      return this.calculateFeeByRateType(rate, durationMinutes);
    } catch (error) {
      throw new ValidationError(
        `Fee estimation failed: ${error}`,
        'FEE_ESTIMATION_ERROR'
      );
    }
  }

  /**
   * Gets rate for specific vehicle type and rate type
   */
  async getRateByType(vehicleType: VehicleType, rateType: RateType, effectiveDate?: Date): Promise<ParkingRate | null> {
    try {
      return await this.rateRepository.findByVehicleAndRateType(vehicleType, rateType, effectiveDate);
    } catch (error) {
      throw new ValidationError(
        `Failed to get rate by type: ${error}`,
        'RATE_BY_TYPE_ERROR'
      );
    }
  }
}