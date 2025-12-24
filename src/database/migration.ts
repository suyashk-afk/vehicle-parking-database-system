/**
 * Database migration system
 */

import { IDatabase } from '../models/interfaces';

export class DatabaseMigration {
  constructor(private database: IDatabase) {}

  /**
   * Initializes the database schema
   */
  async initializeSchema(): Promise<void> {
    try {
      // Create tables one by one
      await this.createVehiclesTable();
      await this.createParkingSpacesTable();
      await this.createParkingRatesTable();
      await this.createParkingSessionsTable();
      await this.createIndexes();
      await this.createTriggers();

      console.log('Database schema initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize database schema: ${error}`);
    }
  }

  private async createVehiclesTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS vehicles (
        license_plate TEXT PRIMARY KEY,
        vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.database.execute(sql);
  }

  private async createParkingSpacesTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS parking_spaces (
        space_id TEXT PRIMARY KEY,
        space_type TEXT NOT NULL CHECK (space_type IN ('CAR', 'MOTORCYCLE', 'TRUCK', 'HANDICAP')),
        zone TEXT NOT NULL,
        is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.database.execute(sql);
  }

  private async createParkingRatesTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS parking_rates (
        rate_id TEXT PRIMARY KEY,
        vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN')),
        rate_type TEXT NOT NULL CHECK (rate_type IN ('HOURLY', 'DAILY', 'FLAT')),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        effective_from DATETIME NOT NULL,
        effective_until DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (effective_until IS NULL OR effective_until > effective_from)
      )
    `;
    await this.database.execute(sql);
  }

  private async createParkingSessionsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS parking_sessions (
        session_id TEXT PRIMARY KEY,
        license_plate TEXT NOT NULL,
        space_id TEXT NOT NULL,
        entry_time DATETIME NOT NULL,
        exit_time DATETIME,
        calculated_fee DECIMAL(10,2),
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (exit_time IS NULL OR exit_time > entry_time),
        CHECK (calculated_fee IS NULL OR calculated_fee >= 0)
      )
    `;
    await this.database.execute(sql);
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type)',
      'CREATE INDEX IF NOT EXISTS idx_spaces_type_occupied ON parking_spaces(space_type, is_occupied)',
      'CREATE INDEX IF NOT EXISTS idx_spaces_zone ON parking_spaces(zone)',
      'CREATE INDEX IF NOT EXISTS idx_rates_vehicle_effective ON parking_rates(vehicle_type, effective_from, effective_until)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_license_plate ON parking_sessions(license_plate)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON parking_sessions(entry_time)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_status ON parking_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_space_id ON parking_sessions(space_id)',
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session 
       ON parking_sessions(license_plate) 
       WHERE status = 'ACTIVE'`
    ];

    for (const indexSql of indexes) {
      await this.database.execute(indexSql);
    }
  }

  private async createTriggers(): Promise<void> {
    const triggerSql = `
      CREATE TRIGGER IF NOT EXISTS update_session_timestamp 
      AFTER UPDATE ON parking_sessions
      BEGIN
        UPDATE parking_sessions 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE session_id = NEW.session_id;
      END
    `;
    await this.database.execute(triggerSql);
  }

  /**
   * Seeds the database with initial data
   */
  async seedInitialData(): Promise<void> {
    try {
      await this.database.beginTransaction();

      // Create default parking spaces
      await this.createDefaultSpaces();
      
      // Create default parking rates
      await this.createDefaultRates();

      await this.database.commitTransaction();
      console.log('Database seeded with initial data successfully');
    } catch (error) {
      await this.database.rollbackTransaction();
      throw new Error(`Failed to seed database: ${error}`);
    }
  }

  /**
   * Creates default parking spaces
   */
  private async createDefaultSpaces(): Promise<void> {
    const spaces = [
      // Zone A - Car spaces
      { spaceId: 'A001', spaceType: 'CAR', zone: 'A' },
      { spaceId: 'A002', spaceType: 'CAR', zone: 'A' },
      { spaceId: 'A003', spaceType: 'CAR', zone: 'A' },
      { spaceId: 'A004', spaceType: 'CAR', zone: 'A' },
      { spaceId: 'A005', spaceType: 'CAR', zone: 'A' },
      
      // Zone A - Handicap spaces
      { spaceId: 'A006', spaceType: 'HANDICAP', zone: 'A' },
      { spaceId: 'A007', spaceType: 'HANDICAP', zone: 'A' },
      
      // Zone B - Motorcycle spaces
      { spaceId: 'B001', spaceType: 'MOTORCYCLE', zone: 'B' },
      { spaceId: 'B002', spaceType: 'MOTORCYCLE', zone: 'B' },
      { spaceId: 'B003', spaceType: 'MOTORCYCLE', zone: 'B' },
      { spaceId: 'B004', spaceType: 'MOTORCYCLE', zone: 'B' },
      
      // Zone C - Truck spaces
      { spaceId: 'C001', spaceType: 'TRUCK', zone: 'C' },
      { spaceId: 'C002', spaceType: 'TRUCK', zone: 'C' },
      { spaceId: 'C003', spaceType: 'TRUCK', zone: 'C' },
      
      // Zone D - Mixed spaces
      { spaceId: 'D001', spaceType: 'CAR', zone: 'D' },
      { spaceId: 'D002', spaceType: 'CAR', zone: 'D' },
      { spaceId: 'D003', spaceType: 'MOTORCYCLE', zone: 'D' },
      { spaceId: 'D004', spaceType: 'TRUCK', zone: 'D' },
    ];

    for (const space of spaces) {
      await this.database.execute(
        'INSERT OR IGNORE INTO parking_spaces (space_id, space_type, zone, is_occupied) VALUES (?, ?, ?, ?)',
        [space.spaceId, space.spaceType, space.zone, false]
      );
    }
  }

  /**
   * Creates default parking rates
   */
  private async createDefaultRates(): Promise<void> {
    const rates = [
      // Hourly rates (Indian parking rates)
      { vehicleType: 'CAR', rateType: 'HOURLY', amount: 20.00 },
      { vehicleType: 'MOTORCYCLE', rateType: 'HOURLY', amount: 10.00 },
      { vehicleType: 'TRUCK', rateType: 'HOURLY', amount: 50.00 },
      { vehicleType: 'VAN', rateType: 'HOURLY', amount: 30.00 },
      
      // Daily rates (Indian parking rates)
      { vehicleType: 'CAR', rateType: 'DAILY', amount: 150.00 },
      { vehicleType: 'MOTORCYCLE', rateType: 'DAILY', amount: 80.00 },
      { vehicleType: 'TRUCK', rateType: 'DAILY', amount: 400.00 },
      { vehicleType: 'VAN', rateType: 'DAILY', amount: 250.00 },

      // Monthly rates (for long-term parking)
      { vehicleType: 'CAR', rateType: 'FLAT', amount: 3000.00 },
      { vehicleType: 'MOTORCYCLE', rateType: 'FLAT', amount: 1500.00 },
      { vehicleType: 'TRUCK', rateType: 'FLAT', amount: 8000.00 },
      { vehicleType: 'VAN', rateType: 'FLAT', amount: 5000.00 },
    ];

    for (const rate of rates) {
      // Generate UUID for rate_id
      const rateId = this.generateUUID();
      const effectiveFrom = new Date().toISOString();
      
      await this.database.execute(
        'INSERT OR IGNORE INTO parking_rates (rate_id, vehicle_type, rate_type, amount, effective_from) VALUES (?, ?, ?, ?, ?)',
        [rateId, rate.vehicleType, rate.rateType, rate.amount, effectiveFrom]
      );
    }
  }

  /**
   * Generates a simple UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Drops all tables (for testing purposes)
   */
  async dropAllTables(): Promise<void> {
    const tables = ['parking_sessions', 'parking_rates', 'parking_spaces', 'vehicles'];
    
    for (const table of tables) {
      await this.database.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    
    console.log('All tables dropped successfully');
  }

  /**
   * Resets the database (drop and recreate)
   */
  async resetDatabase(): Promise<void> {
    await this.dropAllTables();
    await this.initializeSchema();
    await this.seedInitialData();
    console.log('Database reset completed successfully');
  }
}