/**
 * Express server for web interface
 */

import express from 'express';
import path from 'path';
import { ParkingManager } from '../services/parking-manager';
import { SpaceManager } from '../services/space-manager';
import { FeeCalculator } from '../services/fee-calculator';
import { SessionRepository } from '../repositories/session-repository';
import { SpaceRepository } from '../repositories/space-repository';
import { RateRepository } from '../repositories/rate-repository';
import { VehicleRepository } from '../repositories/vehicle-repository';
import { DatabaseConnection } from '../database/connection';
import { DatabaseMigration } from '../database/migration';
import { VehicleType } from '../types';

export class WebServer {
  private app: express.Application;
  private parkingManager!: ParkingManager;
  private database: DatabaseConnection;

  constructor(private port: number = 3000) {
    this.app = express();
    this.database = new DatabaseConnection('parking-web.db');
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupParkingManager(): void {
    // Initialize repositories
    const sessionRepo = new SessionRepository(this.database);
    const spaceRepo = new SpaceRepository(this.database);
    const rateRepo = new RateRepository(this.database);
    const vehicleRepo = new VehicleRepository(this.database);

    // Initialize services
    const spaceManager = new SpaceManager(spaceRepo);
    const feeCalculator = new FeeCalculator(rateRepo);

    // Initialize parking manager
    this.parkingManager = new ParkingManager(
      spaceManager,
      feeCalculator,
      sessionRepo,
      vehicleRepo,
      this.database
    );
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS for development
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }

  private setupRoutes(): void {
    // Serve the main dashboard
    this.app.get('/', (_req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API Routes
    this.app.get('/api/availability', async (_req, res) => {
      try {
        console.log('API: Getting availability...');
        const availability = await this.parkingManager.getAvailability();
        console.log('API: Availability result:', availability);
        res.json(availability);
      } catch (error) {
        console.error('API: Availability error:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/spaces', async (_req, res) => {
      try {
        console.log('API: Getting spaces...');
        const spaceManager = this.getSpaceManager();
        const allSpaces = await spaceManager.getAllSpaces();
        const activeSessions = await this.parkingManager.getActiveSessions();
        
        console.log(`API: Found ${allSpaces.length} spaces, ${activeSessions.length} active sessions`);
        
        // Create a map of occupied spaces
        const occupiedSpaces = new Set(activeSessions.map(session => session.spaceId));
        
        // Format spaces with occupancy info
        const spacesWithStatus = allSpaces.map((space: any) => ({
          spaceId: space.spaceId,
          spaceType: space.spaceType,
          zone: space.zone,
          isOccupied: occupiedSpaces.has(space.spaceId),
          licensePlate: activeSessions.find(session => session.spaceId === space.spaceId)?.licensePlate
        }));
        
        console.log('API: Spaces with status:', spacesWithStatus.length);
        res.json(spacesWithStatus);
      } catch (error) {
        console.error('API: Spaces error:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/active-sessions', async (_req, res) => {
      try {
        console.log('API: Getting active sessions...');
        const sessions = await this.parkingManager.getActiveSessions();
        console.log(`API: Found ${sessions.length} active sessions`);
        res.json(sessions);
      } catch (error) {
        console.error('API: Active sessions error:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/enter', async (req, res) => {
      try {
        const { licensePlate, vehicleType } = req.body;
        const result = await this.parkingManager.enterVehicle({
          licensePlate,
          vehicleType: vehicleType as VehicleType,
          createdAt: new Date()
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/exit', async (req, res) => {
      try {
        const { licensePlate } = req.body;
        const result = await this.parkingManager.exitVehicle(licensePlate);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/search/:licensePlate', async (req, res) => {
      try {
        const { licensePlate } = req.params;
        const sessions = await this.parkingManager.getVehicleSessions(licensePlate);
        res.json(sessions);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/report', async (req, res) => {
      try {
        const days = req.query.days ? parseInt(req.query.days as string) : undefined;
        let startDate: Date | undefined;
        if (days) {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        }
        const report = await this.parkingManager.generateReport(startDate);
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Demo data endpoint for exhibition
    this.app.post('/api/demo/populate', async (_req, res) => {
      try {
        console.log('API: Populating demo data...');
        await this.populateDemoData();
        console.log('API: Demo data populated successfully');
        res.json({ success: true, message: 'Demo data populated successfully' });
      } catch (error) {
        console.error('API: Demo populate error:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/demo/reset', async (_req, res) => {
      try {
        console.log('API: Resetting demo data...');
        await this.resetDemoData();
        console.log('API: Demo data reset successfully');
        res.json({ success: true, message: 'Demo data reset successfully' });
      } catch (error) {
        console.error('API: Demo reset error:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/demo/reset-revenue', async (_req, res) => {
      try {
        console.log('API: Resetting revenue data...');
        await this.resetRevenueData();
        console.log('API: Revenue data reset successfully');
        res.json({ success: true, message: 'Revenue data reset successfully' });
      } catch (error) {
        console.error('API: Revenue reset error:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });
  }

  private async populateDemoData(): Promise<void> {
    try {
      // Simple, reliable demo data that works
      const demoVehicles = [
        { licensePlate: 'MH01AB1234', vehicleType: VehicleType.CAR },
        { licensePlate: 'DL02CD5678', vehicleType: VehicleType.MOTORCYCLE },
        { licensePlate: 'KA03EF9012', vehicleType: VehicleType.TRUCK },
        { licensePlate: 'TN04GH3456', vehicleType: VehicleType.CAR },
        { licensePlate: 'GJ05IJ7890', vehicleType: VehicleType.VAN },
        { licensePlate: 'UP06KL2345', vehicleType: VehicleType.CAR },
        { licensePlate: 'RJ07MN6789', vehicleType: VehicleType.MOTORCYCLE },
        { licensePlate: 'WB08OP1234', vehicleType: VehicleType.CAR },
      ];

      console.log('Populating demo data...');

      // Enter all vehicles
      for (const vehicle of demoVehicles) {
        try {
          const result = await this.parkingManager.enterVehicle({
            licensePlate: vehicle.licensePlate,
            vehicleType: vehicle.vehicleType,
            createdAt: new Date()
          });
          console.log(`Entered vehicle: ${vehicle.licensePlate} - ${result.success ? 'Success' : 'Failed: ' + result.error}`);
        } catch (error) {
          console.log(`Failed to enter vehicle ${vehicle.licensePlate}:`, (error as Error).message);
        }
        
        // Small delay between entries
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait a moment, then exit ONLY SOME vehicles to show both active sessions AND revenue
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Exit only 3 vehicles to create revenue, keep 5 vehicles parked for demo
      const vehiclesToExit = ['MH01AB1234', 'DL02CD5678', 'KA03EF9012'];
      for (const licensePlate of vehiclesToExit) {
        try {
          const result = await this.parkingManager.exitVehicle(licensePlate);
          console.log(`Exited vehicle: ${licensePlate} - ${result.success ? 'Success' : 'Failed: ' + result.error}`);
        } catch (error) {
          console.log(`Failed to exit vehicle ${licensePlate}:`, (error as Error).message);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('Demo data population completed - 5 vehicles remain parked, 3 exited for revenue');
    } catch (error) {
      console.error('Error populating demo data:', error);
      throw error;
    }
  }

  private async resetDemoData(): Promise<void> {
    // Get all active sessions and exit them
    const activeSessions = await this.parkingManager.getActiveSessions();
    for (const session of activeSessions) {
      await this.parkingManager.exitVehicle(session.licensePlate);
    }
  }

  private async resetRevenueData(): Promise<void> {
    try {
      // Delete all completed sessions (sessions with exit_time) to reset revenue
      await this.database.execute('DELETE FROM parking_sessions WHERE exit_time IS NOT NULL');
      console.log('Revenue data reset - all completed sessions deleted');
    } catch (error) {
      console.error('Error resetting revenue data:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    await this.database.connect();
    const migration = new DatabaseMigration(this.database);
    await migration.initializeSchema();
    await migration.seedInitialData();
    
    // Initialize parking manager after database is ready
    this.setupParkingManager();
    
    console.log('✅ Web server database initialized');
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`🌐 Parking System Web Interface running at http://localhost:${this.port}`);
    });
  }

  private getSpaceManager(): any {
    // Access the space manager from parking manager
    return (this.parkingManager as any).spaceManager;
  }

  async close(): Promise<void> {
    await this.database.disconnect();
  }
}