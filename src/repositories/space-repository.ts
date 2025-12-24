/**
 * SpaceRepository implementation for parking space data access
 */

import { IParkingSpaceRepository } from '../models/interfaces';
import { ParkingSpace, SpaceType, AvailabilityReport } from '../types';
import { BaseRepository } from './base-repository';

export class SpaceRepository extends BaseRepository implements IParkingSpaceRepository {
  
  /**
   * Creates a new parking space
   */
  async create(space: ParkingSpace): Promise<ParkingSpace> {
    this.validateRequiredFields(space, ['spaceId', 'spaceType', 'zone']);

    const query = `
      INSERT INTO parking_spaces (space_id, space_type, zone, is_occupied, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      space.spaceId,
      space.spaceType,
      space.zone,
      space.isOccupied,
      this.formatDate(space.createdAt)
    ];

    await this.executeQuery(query, params);
    return space;
  }

  /**
   * Finds a parking space by ID
   */
  async findById(spaceId: string): Promise<ParkingSpace | null> {
    const query = `
      SELECT space_id, space_type, zone, is_occupied, created_at
      FROM parking_spaces 
      WHERE space_id = ?
    `;

    const row = await this.queryOne(query, [spaceId]);
    return row ? this.mapRowToSpace(row) : null;
  }

  /**
   * Finds available spaces by type
   */
  async findAvailableByType(spaceType: SpaceType): Promise<ParkingSpace[]> {
    let query = `
      SELECT space_id, space_type, zone, is_occupied, created_at
      FROM parking_spaces 
      WHERE is_occupied = FALSE
    `;

    const params: any[] = [];

    // Handle space type compatibility
    if (spaceType === SpaceType.CAR) {
      // Cars can use CAR, TRUCK, or HANDICAP spaces
      query += ' AND space_type IN (?, ?, ?)';
      params.push(SpaceType.CAR, SpaceType.TRUCK, SpaceType.HANDICAP);
    } else if (spaceType === SpaceType.MOTORCYCLE) {
      // Motorcycles can use MOTORCYCLE or HANDICAP spaces
      query += ' AND space_type IN (?, ?)';
      params.push(SpaceType.MOTORCYCLE, SpaceType.HANDICAP);
    } else if (spaceType === SpaceType.TRUCK) {
      // Trucks can use TRUCK or HANDICAP spaces
      query += ' AND space_type IN (?, ?)';
      params.push(SpaceType.TRUCK, SpaceType.HANDICAP);
    } else {
      // For other types, exact match
      query += ' AND space_type = ?';
      params.push(spaceType);
    }

    query += ' ORDER BY space_type, space_id';

    const rows = await this.queryMultiple(query, params);
    return rows.map(row => this.mapRowToSpace(row));
  }

  /**
   * Updates space occupancy status
   */
  async updateOccupancy(spaceId: string, isOccupied: boolean): Promise<boolean> {
    const query = `
      UPDATE parking_spaces 
      SET is_occupied = ?
      WHERE space_id = ?
    `;

    const result = await this.executeQuery(query, [isOccupied, spaceId]);
    return result.changes > 0;
  }

  /**
   * Gets availability report with counts by type and zone
   */
  async getAvailabilityReport(): Promise<AvailabilityReport> {
    // Get overall counts
    const overallQuery = `
      SELECT 
        COUNT(*) as total_capacity,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied_spaces,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as available_spaces
      FROM parking_spaces
    `;

    const overallRow = await this.queryOne(overallQuery);

    // Get counts by space type
    const typeQuery = `
      SELECT 
        space_type,
        COUNT(*) as total,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as available
      FROM parking_spaces
      GROUP BY space_type
    `;

    const typeRows = await this.queryMultiple(typeQuery);

    // Get counts by zone
    const zoneQuery = `
      SELECT 
        zone,
        COUNT(*) as total,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as available
      FROM parking_spaces
      GROUP BY zone
    `;

    const zoneRows = await this.queryMultiple(zoneQuery);

    // Build spaces by type object
    const spacesByType: Record<SpaceType, { total: number; occupied: number; available: number }> = {} as any;
    for (const row of typeRows) {
      spacesByType[row.space_type as SpaceType] = {
        total: row.total,
        occupied: row.occupied,
        available: row.available
      };
    }

    // Build spaces by zone object
    const spacesByZone: Record<string, { total: number; occupied: number; available: number }> = {};
    for (const row of zoneRows) {
      spacesByZone[row.zone] = {
        total: row.total,
        occupied: row.occupied,
        available: row.available
      };
    }

    const totalCapacity = overallRow?.total_capacity || 0;
    const occupiedSpaces = overallRow?.occupied_spaces || 0;
    const availableSpaces = overallRow?.available_spaces || 0;

    return {
      totalCapacity,
      occupiedSpaces,
      availableSpaces,
      utilizationPercentage: totalCapacity > 0 ? (occupiedSpaces / totalCapacity) * 100 : 0,
      spacesByType,
      spacesByZone
    };
  }

  /**
   * Gets all parking spaces
   */
  async getAllSpaces(): Promise<ParkingSpace[]> {
    const query = `
      SELECT space_id, space_type, zone, is_occupied, created_at
      FROM parking_spaces 
      ORDER BY zone, space_type, space_id
    `;

    const rows = await this.queryMultiple(query);
    return rows.map(row => this.mapRowToSpace(row));
  }

  /**
   * Gets spaces by zone
   */
  async findByZone(zone: string): Promise<ParkingSpace[]> {
    const query = `
      SELECT space_id, space_type, zone, is_occupied, created_at
      FROM parking_spaces 
      WHERE zone = ?
      ORDER BY space_type, space_id
    `;

    const rows = await this.queryMultiple(query, [zone]);
    return rows.map(row => this.mapRowToSpace(row));
  }

  /**
   * Gets count of available spaces for a specific vehicle type
   */
  async getAvailableCount(vehicleType?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM parking_spaces 
      WHERE is_occupied = FALSE
    `;

    const params: any[] = [];

    if (vehicleType) {
      // Handle vehicle type compatibility
      if (vehicleType === 'CAR') {
        query += ' AND space_type IN (?, ?, ?)';
        params.push('CAR', 'TRUCK', 'HANDICAP');
      } else if (vehicleType === 'MOTORCYCLE') {
        query += ' AND space_type IN (?, ?)';
        params.push('MOTORCYCLE', 'HANDICAP');
      } else if (vehicleType === 'TRUCK') {
        query += ' AND space_type IN (?, ?)';
        params.push('TRUCK', 'HANDICAP');
      } else {
        query += ' AND space_type = ?';
        params.push(vehicleType);
      }
    }

    const row = await this.queryOne(query, params);
    return row?.count || 0;
  }

  /**
   * Maps database row to ParkingSpace object
   */
  private mapRowToSpace(row: any): ParkingSpace {
    return {
      spaceId: row.space_id,
      spaceType: row.space_type,
      zone: row.zone,
      isOccupied: this.parseBoolean(row.is_occupied),
      createdAt: new Date(row.created_at)
    };
  }
}