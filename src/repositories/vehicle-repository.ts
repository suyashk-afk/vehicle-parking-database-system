/**
 * VehicleRepository implementation for vehicle data access
 */

import { IVehicleRepository } from '../models/interfaces';
import { Vehicle } from '../types';
import { BaseRepository } from './base-repository';

export class VehicleRepository extends BaseRepository implements IVehicleRepository {
  
  /**
   * Creates a new vehicle
   */
  async create(vehicle: Vehicle): Promise<Vehicle> {
    this.validateRequiredFields(vehicle, ['licensePlate', 'vehicleType']);

    const query = `
      INSERT INTO vehicles (license_plate, vehicle_type, created_at)
      VALUES (?, ?, ?)
    `;

    const params = [
      vehicle.licensePlate,
      vehicle.vehicleType,
      this.formatDate(vehicle.createdAt)
    ];

    await this.executeQuery(query, params);
    return vehicle;
  }

  /**
   * Finds a vehicle by license plate
   */
  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const query = `
      SELECT license_plate, vehicle_type, created_at
      FROM vehicles 
      WHERE license_plate = ?
    `;

    const row = await this.queryOne(query, [licensePlate]);
    return row ? this.mapRowToVehicle(row) : null;
  }

  /**
   * Updates a vehicle
   */
  async update(vehicle: Vehicle): Promise<Vehicle> {
    this.validateRequiredFields(vehicle, ['licensePlate']);

    const query = `
      UPDATE vehicles 
      SET vehicle_type = ?
      WHERE license_plate = ?
    `;

    const params = [
      vehicle.vehicleType,
      vehicle.licensePlate
    ];

    const result = await this.executeQuery(query, params);
    
    if (result.changes === 0) {
      throw new Error(`Vehicle with license plate ${vehicle.licensePlate} not found`);
    }

    return vehicle;
  }

  /**
   * Deletes a vehicle
   */
  async delete(licensePlate: string): Promise<boolean> {
    const query = 'DELETE FROM vehicles WHERE license_plate = ?';
    const result = await this.executeQuery(query, [licensePlate]);
    return result.changes > 0;
  }

  /**
   * Finds all vehicles
   */
  async findAll(): Promise<Vehicle[]> {
    const query = `
      SELECT license_plate, vehicle_type, created_at
      FROM vehicles 
      ORDER BY created_at DESC
    `;

    const rows = await this.queryMultiple(query);
    return rows.map(row => this.mapRowToVehicle(row));
  }

  /**
   * Finds vehicles by type
   */
  async findByType(vehicleType: string): Promise<Vehicle[]> {
    const query = `
      SELECT license_plate, vehicle_type, created_at
      FROM vehicles 
      WHERE vehicle_type = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.queryMultiple(query, [vehicleType]);
    return rows.map(row => this.mapRowToVehicle(row));
  }

  /**
   * Checks if a vehicle exists
   */
  async exists(licensePlate: string): Promise<boolean> {
    const query = 'SELECT 1 FROM vehicles WHERE license_plate = ?';
    const row = await this.queryOne(query, [licensePlate]);
    return row !== null;
  }

  /**
   * Maps database row to Vehicle object
   */
  private mapRowToVehicle(row: any): Vehicle {
    return {
      licensePlate: row.license_plate,
      vehicleType: row.vehicle_type,
      createdAt: new Date(row.created_at)
    };
  }
}