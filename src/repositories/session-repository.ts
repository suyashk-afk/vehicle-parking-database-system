/**
 * SessionRepository implementation for parking session data access
 */

import { IParkingSessionRepository } from '../models/interfaces';
import { ParkingSession, SearchCriteria, RevenueReport } from '../types';
import { BaseRepository } from './base-repository';

export class SessionRepository extends BaseRepository implements IParkingSessionRepository {
  
  /**
   * Creates a new parking session
   */
  async create(session: ParkingSession): Promise<ParkingSession> {
    this.validateRequiredFields(session, ['sessionId', 'licensePlate', 'spaceId', 'entryTime', 'status']);

    const query = `
      INSERT INTO parking_sessions 
      (session_id, license_plate, space_id, entry_time, exit_time, calculated_fee, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      session.sessionId,
      session.licensePlate,
      session.spaceId,
      this.formatDate(session.entryTime),
      session.exitTime ? this.formatDate(session.exitTime) : null,
      session.calculatedFee || null,
      session.status,
      this.formatDate(session.createdAt),
      this.formatDate(session.updatedAt)
    ];

    await this.executeQuery(query, params);
    return session;
  }

  /**
   * Finds a parking session by ID
   */
  async findById(sessionId: string): Promise<ParkingSession | null> {
    const query = `
      SELECT session_id, license_plate, space_id, entry_time, exit_time, 
             calculated_fee, status, created_at, updated_at
      FROM parking_sessions 
      WHERE session_id = ?
    `;

    const row = await this.queryOne(query, [sessionId]);
    return row ? this.mapRowToSession(row) : null;
  }

  /**
   * Finds active session by license plate
   */
  async findActiveByLicensePlate(licensePlate: string): Promise<ParkingSession | null> {
    const query = `
      SELECT session_id, license_plate, space_id, entry_time, exit_time, 
             calculated_fee, status, created_at, updated_at
      FROM parking_sessions 
      WHERE license_plate = ? AND status = 'ACTIVE'
      ORDER BY entry_time DESC
      LIMIT 1
    `;

    const row = await this.queryOne(query, [licensePlate]);
    return row ? this.mapRowToSession(row) : null;
  }

  /**
   * Finds all sessions for a license plate
   */
  async findByLicensePlate(licensePlate: string): Promise<ParkingSession[]> {
    const query = `
      SELECT session_id, license_plate, space_id, entry_time, exit_time, 
             calculated_fee, status, created_at, updated_at
      FROM parking_sessions 
      WHERE license_plate = ?
      ORDER BY entry_time DESC
    `;

    const rows = await this.queryMultiple(query, [licensePlate]);
    return rows.map(row => this.mapRowToSession(row));
  }

  /**
   * Finds sessions by search criteria
   */
  async findByCriteria(criteria: SearchCriteria): Promise<ParkingSession[]> {
    let query = `
      SELECT ps.session_id, ps.license_plate, ps.space_id, ps.entry_time, ps.exit_time, 
             ps.calculated_fee, ps.status, ps.created_at, ps.updated_at
      FROM parking_sessions ps
      LEFT JOIN vehicles v ON ps.license_plate = v.license_plate
      WHERE 1=1
    `;

    const params: any[] = [];

    // Add license plate filter
    if (criteria.licensePlate) {
      query += ' AND ps.license_plate = ?';
      params.push(criteria.licensePlate);
    }

    // Add vehicle type filter
    if (criteria.vehicleType) {
      query += ' AND v.vehicle_type = ?';
      params.push(criteria.vehicleType);
    }

    // Add date range filters
    if (criteria.startDate) {
      query += ' AND ps.entry_time >= ?';
      params.push(this.formatDate(criteria.startDate));
    }

    if (criteria.endDate) {
      query += ' AND ps.entry_time <= ?';
      params.push(this.formatDate(criteria.endDate));
    }

    // Add fee range filters
    if (criteria.minFee !== undefined) {
      query += ' AND ps.calculated_fee >= ?';
      params.push(criteria.minFee);
    }

    if (criteria.maxFee !== undefined) {
      query += ' AND ps.calculated_fee <= ?';
      params.push(criteria.maxFee);
    }

    // Add duration filters (calculated on the fly)
    if (criteria.minDuration !== undefined) {
      query += ' AND ((julianday(COALESCE(ps.exit_time, datetime("now"))) - julianday(ps.entry_time)) * 24 * 60) >= ?';
      params.push(criteria.minDuration);
    }

    if (criteria.maxDuration !== undefined) {
      query += ' AND ((julianday(COALESCE(ps.exit_time, datetime("now"))) - julianday(ps.entry_time)) * 24 * 60) <= ?';
      params.push(criteria.maxDuration);
    }

    query += ' ORDER BY ps.entry_time DESC';

    const rows = await this.queryMultiple(query, params);
    return rows.map(row => this.mapRowToSession(row));
  }

  /**
   * Updates a parking session
   */
  async update(session: ParkingSession): Promise<ParkingSession> {
    this.validateRequiredFields(session, ['sessionId']);

    const query = `
      UPDATE parking_sessions 
      SET license_plate = ?, space_id = ?, entry_time = ?, exit_time = ?, 
          calculated_fee = ?, status = ?, updated_at = ?
      WHERE session_id = ?
    `;

    const params = [
      session.licensePlate,
      session.spaceId,
      this.formatDate(session.entryTime),
      session.exitTime ? this.formatDate(session.exitTime) : null,
      session.calculatedFee || null,
      session.status,
      this.formatDate(new Date()),
      session.sessionId
    ];

    const result = await this.executeQuery(query, params);
    
    if (result.changes === 0) {
      throw new Error(`Session with ID ${session.sessionId} not found`);
    }

    return session;
  }

  /**
   * Generates revenue report for a date range
   */
  async generateRevenueReport(startDate?: Date, endDate?: Date): Promise<RevenueReport> {
    let query = `
      SELECT 
        COUNT(*) as session_count,
        SUM(calculated_fee) as total_revenue,
        AVG((julianday(exit_time) - julianday(entry_time)) * 24 * 60) as avg_duration_minutes
      FROM parking_sessions 
      WHERE status = 'COMPLETED' AND calculated_fee IS NOT NULL
    `;

    const params: any[] = [];

    if (startDate) {
      query += ' AND entry_time >= ?';
      params.push(this.formatDate(startDate));
    }

    if (endDate) {
      query += ' AND entry_time <= ?';
      params.push(this.formatDate(endDate));
    }

    const summaryRow = await this.queryOne(query, params);

    // Get peak usage times (by hour)
    let peakQuery = `
      SELECT 
        CAST(strftime('%H', entry_time) AS INTEGER) as hour,
        COUNT(*) as count
      FROM parking_sessions 
      WHERE 1=1
    `;

    if (startDate) {
      peakQuery += ' AND entry_time >= ?';
    }

    if (endDate) {
      peakQuery += ' AND entry_time <= ?';
    }

    peakQuery += ' GROUP BY CAST(strftime("%H", entry_time) AS INTEGER) ORDER BY count DESC';

    const peakRows = await this.queryMultiple(peakQuery, params);

    return {
      totalRevenue: summaryRow?.total_revenue || 0,
      averageParkingDuration: summaryRow?.avg_duration_minutes || 0,
      sessionCount: summaryRow?.session_count || 0,
      peakUsageTimes: peakRows.map(row => ({
        hour: row.hour,
        count: row.count
      }))
    };
  }

  /**
   * Maps database row to ParkingSession object
   */
  private mapRowToSession(row: any): ParkingSession {
    return {
      sessionId: row.session_id,
      licensePlate: row.license_plate,
      spaceId: row.space_id,
      entryTime: new Date(row.entry_time),
      exitTime: row.exit_time ? new Date(row.exit_time) : undefined,
      calculatedFee: row.calculated_fee,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}