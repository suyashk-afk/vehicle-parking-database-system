/**
 * Command-line interface for parking operations
 */

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
import { ValidationError } from '../utils/validation';
import { CLIValidator } from './cli-validator';
import { CLIHelp } from './cli-help';

export class ParkingCLI {
  private parkingManager: ParkingManager;
  private database: DatabaseConnection;

  constructor(dbPath: string = ':memory:') {
    this.database = new DatabaseConnection(dbPath);
    
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

  /**
   * Initializes the database and CLI
   */
  async initialize(): Promise<void> {
    try {
      await this.database.connect();
      const migration = new DatabaseMigration(this.database);
      await migration.initializeSchema();
      await migration.seedInitialData();
      console.log('✅ Parking system initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize parking system:', error);
      throw error;
    }
  }

  /**
   * Processes vehicle entry
   */
  async enterVehicle(licensePlate: string, vehicleType: string): Promise<void> {
    try {
      // Validate vehicle type
      if (!Object.values(VehicleType).includes(vehicleType as VehicleType)) {
        throw new ValidationError(
          `Invalid vehicle type: ${vehicleType}. Must be one of: ${Object.values(VehicleType).join(', ')}`,
          'INVALID_VEHICLE_TYPE'
        );
      }

      const result = await this.parkingManager.enterVehicle({
        licensePlate,
        vehicleType: vehicleType as VehicleType,
        createdAt: new Date()
      });

      if (result.success && result.session) {
        console.log('✅ Vehicle entry successful');
        console.log(`📋 Session ID: ${result.session.sessionId}`);
        console.log(`🚗 License Plate: ${result.session.licensePlate}`);
        console.log(`🅿️  Space ID: ${result.session.spaceId}`);
        console.log(`⏰ Entry Time: ${result.session.entryTime.toLocaleString()}`);
      } else {
        console.log('❌ Vehicle entry failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error during vehicle entry:', error);
    }
  }

  /**
   * Processes vehicle exit
   */
  async exitVehicle(licensePlate: string): Promise<void> {
    try {
      const result = await this.parkingManager.exitVehicle(licensePlate);

      if (result.success && result.session && result.fee !== undefined) {
        console.log('✅ Vehicle exit successful');
        console.log(`📋 Session ID: ${result.session.sessionId}`);
        console.log(`🚗 License Plate: ${result.session.licensePlate}`);
        console.log(`🅿️  Space ID: ${result.session.spaceId}`);
        console.log(`⏰ Entry Time: ${result.session.entryTime.toLocaleString()}`);
        console.log(`🚪 Exit Time: ${result.session.exitTime?.toLocaleString()}`);
        console.log(`💰 Parking Fee: ₹${result.fee.toFixed(2)}`);
        
        if (result.session.exitTime) {
          const duration = Math.ceil((result.session.exitTime.getTime() - result.session.entryTime.getTime()) / (1000 * 60));
          console.log(`⏱️  Duration: ${duration} minutes`);
        }
      } else {
        console.log('❌ Vehicle exit failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error during vehicle exit:', error);
    }
  }

  /**
   * Shows current availability
   */
  async showAvailability(): Promise<void> {
    try {
      const availability = await this.parkingManager.getAvailability();

      console.log('\n📊 Parking Availability Report');
      console.log('================================');
      console.log(`🏢 Total Capacity: ${availability.totalCapacity}`);
      console.log(`🚗 Occupied Spaces: ${availability.occupiedSpaces}`);
      console.log(`🅿️  Available Spaces: ${availability.availableSpaces}`);
      console.log(`📈 Utilization: ${availability.utilizationPercentage.toFixed(1)}%`);

      console.log('\n📋 By Vehicle Type:');
      for (const [type, stats] of Object.entries(availability.spacesByType)) {
        console.log(`  ${type}: ${stats.available}/${stats.total} available`);
      }

      console.log('\n🏗️  By Zone:');
      for (const [zone, stats] of Object.entries(availability.spacesByZone)) {
        console.log(`  Zone ${zone}: ${stats.available}/${stats.total} available`);
      }
    } catch (error) {
      console.error('❌ Error getting availability:', error);
    }
  }

  /**
   * Shows active sessions
   */
  async showActiveSessions(): Promise<void> {
    try {
      const sessions = await this.parkingManager.getActiveSessions();

      console.log('\n🚗 Active Parking Sessions');
      console.log('==========================');
      
      if (sessions.length === 0) {
        console.log('No active sessions');
        return;
      }

      for (const session of sessions) {
        const duration = Math.ceil((new Date().getTime() - session.entryTime.getTime()) / (1000 * 60));
        console.log(`📋 ${session.sessionId}`);
        console.log(`  🚗 License: ${session.licensePlate}`);
        console.log(`  🅿️  Space: ${session.spaceId}`);
        console.log(`  ⏰ Entry: ${session.entryTime.toLocaleString()}`);
        console.log(`  ⏱️  Duration: ${duration} minutes`);
        console.log('');
      }
    } catch (error) {
      console.error('❌ Error getting active sessions:', error);
    }
  }

  /**
   * Searches sessions by license plate
   */
  async searchSessions(licensePlate: string): Promise<void> {
    try {
      const sessions = await this.parkingManager.getVehicleSessions(licensePlate);

      console.log(`\n🔍 Sessions for ${licensePlate}`);
      console.log('================================');
      
      if (sessions.length === 0) {
        console.log('No sessions found');
        return;
      }

      for (const session of sessions) {
        console.log(`📋 ${session.sessionId} (${session.status})`);
        console.log(`  🅿️  Space: ${session.spaceId}`);
        console.log(`  ⏰ Entry: ${session.entryTime.toLocaleString()}`);
        
        if (session.exitTime) {
          console.log(`  🚪 Exit: ${session.exitTime.toLocaleString()}`);
          const duration = Math.ceil((session.exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60));
          console.log(`  ⏱️  Duration: ${duration} minutes`);
        }
        
        if (session.calculatedFee) {
          console.log(`  💰 Fee: ₹${session.calculatedFee.toFixed(2)}`);
        }
        console.log('');
      }
    } catch (error) {
      console.error('❌ Error searching sessions:', error);
    }
  }

  /**
   * Generates revenue report
   */
  async generateReport(days?: number): Promise<void> {
    try {
      let startDate: Date | undefined;
      if (days) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      const report = await this.parkingManager.generateReport(startDate);

      console.log('\n💰 Revenue Report');
      console.log('=================');
      console.log(`💵 Total Revenue: ₹${report.totalRevenue.toFixed(2)}`);
      console.log(`📊 Total Sessions: ${report.sessionCount}`);
      console.log(`⏱️  Average Duration: ${report.averageParkingDuration.toFixed(1)} minutes`);

      if (report.peakUsageTimes.length > 0) {
        console.log('\n📈 Peak Usage Times:');
        report.peakUsageTimes.slice(0, 5).forEach(peak => {
          console.log(`  ${peak.hour}:00 - ${peak.count} entries`);
        });
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
    }
  }

  /**
   * Shows help information
   */
  showHelp(command?: string): void {
    if (command) {
      CLIHelp.showCommandHelp(command);
    } else {
      CLIHelp.showGeneralHelp();
    }
  }

  /**
   * Processes command line arguments
   */
  async processCommand(args: string[]): Promise<boolean> {
    if (args.length === 0) {
      this.showHelp();
      return true;
    }

    const command = args[0].toLowerCase();

    try {
      switch (command) {
        case 'enter':
          const enterValidation = CLIValidator.validateEnterCommand(args);
          if (!enterValidation.isValid) {
            console.log(CLIValidator.formatError(enterValidation.error!, command));
            return true;
          }
          await this.enterVehicle(args[1], args[2].toUpperCase());
          break;

        case 'exit':
          const exitValidation = CLIValidator.validateExitCommand(args);
          if (!exitValidation.isValid) {
            console.log(CLIValidator.formatError(exitValidation.error!, command));
            return true;
          }
          await this.exitVehicle(args[1]);
          break;

        case 'availability':
          await this.showAvailability();
          break;

        case 'active':
          await this.showActiveSessions();
          break;

        case 'search':
          const searchValidation = CLIValidator.validateSearchCommand(args);
          if (!searchValidation.isValid) {
            console.log(CLIValidator.formatError(searchValidation.error!, command));
            return true;
          }
          await this.searchSessions(args[1]);
          break;

        case 'report':
          const reportValidation = CLIValidator.validateReportCommand(args);
          if (!reportValidation.isValid) {
            console.log(CLIValidator.formatError(reportValidation.error!, command));
            return true;
          }
          await this.generateReport(reportValidation.days);
          break;

        case 'help':
          const helpCommand = args.length > 1 ? args[1] : undefined;
          this.showHelp(helpCommand);
          break;

        case 'info':
          CLIHelp.showSystemInfo();
          break;

        case 'quit':
        case 'exit':
          console.log('👋 Goodbye!');
          return false;

        default:
          console.log(`❌ Unknown command: ${command}`);
          const suggestions = CLIValidator.suggestCommand(command);
          if (suggestions.length > 0) {
            console.log(`💡 Did you mean: ${suggestions.join(', ')}?`);
          }
          console.log('💡 Type "help" for available commands');
          break;
      }
    } catch (error) {
      console.error('❌ Command failed:', error);
    }

    return true;
  }

  /**
   * Starts interactive CLI mode
   */
  async startInteractive(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'parking> '
    });

    console.log('🅿️  Welcome to Vehicle Parking Database System');
    console.log('Type "help" for available commands');
    rl.prompt();

    rl.on('line', async (line: string) => {
      const args = line.trim().split(/\s+/);
      const shouldContinue = await this.processCommand(args);
      
      if (shouldContinue) {
        rl.prompt();
      } else {
        rl.close();
      }
    });

    rl.on('close', async () => {
      await this.database.disconnect();
      process.exit(0);
    });
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    await this.database.disconnect();
  }
}