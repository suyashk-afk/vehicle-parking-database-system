# SOURCE CODE

**Link:** https://github.com/your-username/vehicle-parking-database-system

```typescript
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

    // Vehicle entry endpoint
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

    // Vehicle exit endpoint
    this.app.post('/api/exit', async (req, res) => {
      try {
        const { licensePlate } = req.body;
        const result = await this.parkingManager.exitVehicle(licensePlate);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Get parking space availability
    this.app.get('/api/availability', async (_req, res) => {
      try {
        const availability = await this.parkingManager.getAvailability();
        res.json(availability);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Get all parking spaces with status
    this.app.get('/api/spaces', async (_req, res) => {
      try {
        const spaceManager = this.getSpaceManager();
        const allSpaces = await spaceManager.getAllSpaces();
        const activeSessions = await this.parkingManager.getActiveSessions();
        
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
        
        res.json(spacesWithStatus);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Generate revenue report
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
```

**Note:** The above code is a part of the entire project and belongs to the file "server.ts". It is just one among the various files and hence, not the complete source code. The whole source code can be accessed from the link provided above.

## Key Components

The Vehicle Parking Database System consists of several interconnected modules:

### 1. **Web Server (server.ts)**
- Express.js-based REST API server
- Handles HTTP requests for vehicle entry/exit operations
- Serves the web dashboard interface
- Manages CORS and middleware configuration

### 2. **Business Logic Layer**
- **ParkingManager**: Orchestrates parking operations and transactions
- **SpaceManager**: Handles parking space allocation and availability
- **FeeCalculator**: Computes parking fees based on duration and rates

### 3. **Data Access Layer**
- **SessionRepository**: Manages parking session data
- **SpaceRepository**: Handles parking space information
- **RateRepository**: Manages pricing and rate structures
- **VehicleRepository**: Stores vehicle information

### 4. **Database Layer**
- **DatabaseConnection**: SQLite database connectivity
- **DatabaseMigration**: Schema management and initialization
- **Schema**: Relational database structure with proper indexing

### 5. **Frontend Interface**
- **Web Dashboard**: Real-time parking management interface
- **API Integration**: Dynamic data updates and form submissions
- **Responsive Design**: Mobile-friendly user interface

The system architecture follows a layered approach with clear separation of concerns, ensuring maintainability, scalability, and robust error handling throughout the parking management workflow.