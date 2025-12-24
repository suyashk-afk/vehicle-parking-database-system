/**
 * RateRepository implementation for parking rate data access
 */

import { IParkingRateRepository } from '../models/interfaces';
import { ParkingRate, VehicleType } from '../types';
import { BaseRepository } from './base-repository';

export class RateRepository extends BaseRepository implements IParkingRateRepository {
  
  /**
   * Creates a new parking rate
   */
  async create(rate: ParkingRate): Promise<ParkingRate> {
    this.validateRequiredFields(rate, ['rateId', 'vehicleType', 'rateType', 'amount', 'effectiveFrom']);

    const query = `
      INSERT INTO parking_rates 
      (rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      rate.rateId,
      rate.vehicleType,
      rate.rateType,
      rate.amount,
      this.formatDate(rate.effectiveFrom),
      rate.effectiveUntil ? this.formatDate(rate.effectiveUntil) : null,
      this.formatDate(rate.createdAt)
    ];

    await this.executeQuery(query, params);
    return rate;
  }

  /**
   * Finds the current effective rate for a vehicle type
   */
  async findByVehicleType(vehicleType: VehicleType, effectiveDate?: Date): Promise<ParkingRate | null> {
    const checkDate = effectiveDate || new Date();
    
    const query = `
      SELECT rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at
      FROM parking_rates 
      WHERE vehicle_type = ? 
        AND effective_from <= ?
        AND (effective_until IS NULL OR effective_until > ?)
      ORDER BY effective_from DESC
      LIMIT 1
    `;

    const dateString = this.formatDate(checkDate);
    const row = await this.queryOne(query, [vehicleType, dateString, dateString]);
    
    return row ? this.mapRowToRate(row) : null;
  }

  /**
   * Finds all parking rates
   */
  async findAll(): Promise<ParkingRate[]> {
    const query = `
      SELECT rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at
      FROM parking_rates 
      ORDER BY vehicle_type, rate_type, effective_from DESC
    `;

    const rows = await this.queryMultiple(query);
    return rows.map(row => this.mapRowToRate(row));
  }

  /**
   * Finds all current effective rates
   */
  async findCurrentRates(): Promise<ParkingRate[]> {
    const now = this.formatDate(new Date());
    
    const query = `
      SELECT rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at
      FROM parking_rates 
      WHERE effective_from <= ?
        AND (effective_until IS NULL OR effective_until > ?)
      ORDER BY vehicle_type, rate_type
    `;

    const rows = await this.queryMultiple(query, [now, now]);
    return rows.map(row => this.mapRowToRate(row));
  }

  /**
   * Finds rates by vehicle type and rate type
   */
  async findByVehicleAndRateType(vehicleType: VehicleType, rateType: string, effectiveDate?: Date): Promise<ParkingRate | null> {
    const checkDate = effectiveDate || new Date();
    
    const query = `
      SELECT rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at
      FROM parking_rates 
      WHERE vehicle_type = ? 
        AND rate_type = ?
        AND effective_from <= ?
        AND (effective_until IS NULL OR effective_until > ?)
      ORDER BY effective_from DESC
      LIMIT 1
    `;

    const dateString = this.formatDate(checkDate);
    const row = await this.queryOne(query, [vehicleType, rateType, dateString, dateString]);
    
    return row ? this.mapRowToRate(row) : null;
  }

  /**
   * Updates a parking rate
   */
  async update(rate: ParkingRate): Promise<ParkingRate> {
    this.validateRequiredFields(rate, ['rateId']);

    const query = `
      UPDATE parking_rates 
      SET vehicle_type = ?, rate_type = ?, amount = ?, 
          effective_from = ?, effective_until = ?
      WHERE rate_id = ?
    `;

    const params = [
      rate.vehicleType,
      rate.rateType,
      rate.amount,
      this.formatDate(rate.effectiveFrom),
      rate.effectiveUntil ? this.formatDate(rate.effectiveUntil) : null,
      rate.rateId
    ];

    const result = await this.executeQuery(query, params);
    
    if (result.changes === 0) {
      throw new Error(`Rate with ID ${rate.rateId} not found`);
    }

    return rate;
  }

  /**
   * Deletes a parking rate
   */
  async delete(rateId: string): Promise<boolean> {
    const query = 'DELETE FROM parking_rates WHERE rate_id = ?';
    const result = await this.executeQuery(query, [rateId]);
    return result.changes > 0;
  }

  /**
   * Finds rates by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ParkingRate[]> {
    const query = `
      SELECT rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at
      FROM parking_rates 
      WHERE (effective_from <= ? AND (effective_until IS NULL OR effective_until >= ?))
      ORDER BY vehicle_type, rate_type, effective_from
    `;

    const rows = await this.queryMultiple(query, [this.formatDate(endDate), this.formatDate(startDate)]);
    return rows.map(row => this.mapRowToRate(row));
  }

  /**
   * Expires a rate by setting effective_until to current date
   */
  async expireRate(rateId: string): Promise<boolean> {
    const query = `
      UPDATE parking_rates 
      SET effective_until = ?
      WHERE rate_id = ? AND (effective_until IS NULL OR effective_until > ?)
    `;

    const now = this.formatDate(new Date());
    const result = await this.executeQuery(query, [now, rateId, now]);
    return result.changes > 0;
  }

  /**
   * Gets the best rate for a vehicle type and duration
   */
  async getBestRate(vehicleType: VehicleType, durationMinutes: number, effectiveDate?: Date): Promise<ParkingRate | null> {
    const checkDate = effectiveDate || new Date();
    
    const query = `
      SELECT rate_id, vehicle_type, rate_type, amount, effective_from, effective_until, created_at
      FROM parking_rates 
      WHERE vehicle_type = ? 
        AND effective_from <= ?
        AND (effective_until IS NULL OR effective_until > ?)
      ORDER BY effective_from DESC
    `;

    const dateString = this.formatDate(checkDate);
    const rows = await this.queryMultiple(query, [vehicleType, dateString, dateString]);
    
    if (rows.length === 0) {
      return null;
    }

    // Calculate the best rate based on duration
    let bestRate: ParkingRate | null = null;
    let lowestCost = Infinity;

    for (const row of rows) {
      const rate = this.mapRowToRate(row);
      const cost = this.calculateCostForDuration(rate, durationMinutes);
      
      if (cost < lowestCost) {
        lowestCost = cost;
        bestRate = rate;
      }
    }

    return bestRate;
  }

  /**
   * Calculates cost for a given duration and rate
   */
  private calculateCostForDuration(rate: ParkingRate, durationMinutes: number): number {
    switch (rate.rateType) {
      case 'FLAT':
        return rate.amount;
      case 'HOURLY':
        const hours = Math.ceil(durationMinutes / 60);
        return hours * rate.amount;
      case 'DAILY':
        const days = Math.ceil(durationMinutes / (24 * 60));
        return days * rate.amount;
      default:
        return Infinity;
    }
  }

  /**
   * Maps database row to ParkingRate object
   */
  private mapRowToRate(row: any): ParkingRate {
    return {
      rateId: row.rate_id,
      vehicleType: row.vehicle_type,
      rateType: row.rate_type,
      amount: row.amount,
      effectiveFrom: new Date(row.effective_from),
      effectiveUntil: row.effective_until ? new Date(row.effective_until) : undefined,
      createdAt: new Date(row.created_at)
    };
  }
}