/**
 * ParkingManager orchestration service
 */

import { 
  IParkingManager, 
  ISpaceManager, 
  IFeeCalculator, 
  IParkingSessionRepository,
  IVehicleRepository,
  IDatabase
} from '../models/interfaces';
import { 
  Vehicle, 
  ParkingSession, 
  AvailabilityReport, 
  RevenueReport, 
  SearchCriteria,
  SessionStatus 
} from '../types';
import { ParkingSessionModel } from '../models/parking-session';
import { VehicleModel } from '../models/vehicle';
import { ValidationError } from '../utils/validation';

export class ParkingManager implements IParkingManager {
  constructor(
    private spaceManager: ISpaceManager,
    private feeCalculator: IFeeCalculator,
    private sessionRepository: IParkingSessionRepository,
    private vehicleRepository: IVehicleRepository,
    private database: IDatabase
  ) {}

  /**
   * Processes vehicle entry into the parking facility
   */
  async enterVehicle(vehicle: Vehicle): Promise<{ success: boolean; session?: ParkingSession; error?: string }> {
    try {
      // Validate vehicle data
      const vehicleModel = new VehicleModel(vehicle.licensePlate, vehicle.vehicleType, vehicle.createdAt);

      // Start transaction for atomicity
      await this.database.beginTransaction();

      try {
        // Check if vehicle already has an active session
        const existingSession = await this.sessionRepository.findActiveByLicensePlate(vehicleModel.licensePlate);
        if (existingSession) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `Vehicle ${vehicleModel.licensePlate} already has an active parking session`
          };
        }

        // Check if space is available for this vehicle type
        const isSpaceAvailable = await this.spaceManager.isSpaceAvailable(vehicleModel.vehicleType);
        if (!isSpaceAvailable) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `No available parking spaces for vehicle type ${vehicleModel.vehicleType}`
          };
        }

        // Allocate a parking space
        const allocatedSpace = await this.spaceManager.allocateSpace(vehicleModel.vehicleType);
        if (!allocatedSpace) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `Failed to allocate parking space for vehicle type ${vehicleModel.vehicleType}`
          };
        }

        // Create or update vehicle record
        const existingVehicle = await this.vehicleRepository.findByLicensePlate(vehicleModel.licensePlate);
        if (!existingVehicle) {
          await this.vehicleRepository.create(vehicleModel.toObject());
        } else if (existingVehicle.vehicleType !== vehicleModel.vehicleType) {
          // Update vehicle type if it has changed
          await this.vehicleRepository.update(vehicleModel.toObject());
        }

        // Create parking session
        const session = new ParkingSessionModel(
          vehicleModel.licensePlate,
          allocatedSpace.spaceId,
          new Date()
        );

        const createdSession = await this.sessionRepository.create(session.toObject());

        await this.database.commitTransaction();

        return {
          success: true,
          session: createdSession
        };

      } catch (error) {
        await this.database.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: `Vehicle entry failed: ${error}`
      };
    }
  }

  /**
   * Processes vehicle exit from the parking facility
   */
  async exitVehicle(licensePlate: string): Promise<{ success: boolean; session?: ParkingSession; fee?: number; error?: string }> {
    try {
      // Normalize license plate
      const normalizedPlate = licensePlate.replace(/\s/g, '').toUpperCase();

      // Start transaction for atomicity
      await this.database.beginTransaction();

      try {
        // Find active parking session
        const activeSession = await this.sessionRepository.findActiveByLicensePlate(normalizedPlate);
        if (!activeSession) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `No active parking session found for vehicle ${normalizedPlate}`
          };
        }

        // Get vehicle information
        const vehicle = await this.vehicleRepository.findByLicensePlate(normalizedPlate);
        if (!vehicle) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `Vehicle ${normalizedPlate} not found in system`
          };
        }

        const exitTime = new Date();

        // Calculate parking fee
        const calculatedFee = await this.feeCalculator.calculateFee(
          activeSession.entryTime,
          exitTime,
          vehicle.vehicleType
        );

        // Update session with exit information
        const sessionModel = ParkingSessionModel.fromObject(activeSession);
        sessionModel.complete(exitTime, calculatedFee);

        const updatedSession = await this.sessionRepository.update(sessionModel.toObject());

        // Release the parking space
        const spaceReleased = await this.spaceManager.releaseSpace(activeSession.spaceId);
        if (!spaceReleased) {
          throw new ValidationError(
            `Failed to release parking space ${activeSession.spaceId}`,
            'SPACE_RELEASE_FAILED'
          );
        }

        await this.database.commitTransaction();

        return {
          success: true,
          session: updatedSession,
          fee: calculatedFee
        };

      } catch (error) {
        await this.database.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: `Vehicle exit failed: ${error}`
      };
    }
  }

  /**
   * Gets current parking facility availability
   */
  async getAvailability(): Promise<AvailabilityReport> {
    try {
      return await this.spaceManager.getAvailabilityReport();
    } catch (error) {
      throw new ValidationError(
        `Failed to get availability: ${error}`,
        'AVAILABILITY_ERROR'
      );
    }
  }

  /**
   * Searches parking sessions by criteria
   */
  async searchSessions(criteria: SearchCriteria): Promise<ParkingSession[]> {
    try {
      // Normalize license plate if provided
      if (criteria.licensePlate) {
        criteria.licensePlate = criteria.licensePlate.replace(/\s/g, '').toUpperCase();
      }

      return await this.sessionRepository.findByCriteria(criteria);
    } catch (error) {
      throw new ValidationError(
        `Session search failed: ${error}`,
        'SESSION_SEARCH_ERROR'
      );
    }
  }

  /**
   * Generates revenue report for a date range
   */
  async generateReport(startDate?: Date, endDate?: Date): Promise<RevenueReport> {
    try {
      return await this.sessionRepository.generateRevenueReport(startDate, endDate);
    } catch (error) {
      throw new ValidationError(
        `Report generation failed: ${error}`,
        'REPORT_GENERATION_ERROR'
      );
    }
  }

  /**
   * Gets active sessions
   */
  async getActiveSessions(): Promise<ParkingSession[]> {
    try {
      return await this.sessionRepository.findByCriteria({ 
        startDate: new Date(0) // Get all sessions from beginning of time
      }).then(sessions => 
        sessions.filter(session => session.status === SessionStatus.ACTIVE)
      );
    } catch (error) {
      throw new ValidationError(
        `Failed to get active sessions: ${error}`,
        'ACTIVE_SESSIONS_ERROR'
      );
    }
  }

  /**
   * Gets session by ID
   */
  async getSessionById(sessionId: string): Promise<ParkingSession | null> {
    try {
      return await this.sessionRepository.findById(sessionId);
    } catch (error) {
      throw new ValidationError(
        `Failed to get session: ${error}`,
        'SESSION_RETRIEVAL_ERROR'
      );
    }
  }

  /**
   * Gets all sessions for a vehicle
   */
  async getVehicleSessions(licensePlate: string): Promise<ParkingSession[]> {
    try {
      const normalizedPlate = licensePlate.replace(/\s/g, '').toUpperCase();
      return await this.sessionRepository.findByLicensePlate(normalizedPlate);
    } catch (error) {
      throw new ValidationError(
        `Failed to get vehicle sessions: ${error}`,
        'VEHICLE_SESSIONS_ERROR'
      );
    }
  }

  /**
   * Cancels an active parking session (for administrative purposes)
   */
  async cancelSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.database.beginTransaction();

      try {
        const session = await this.sessionRepository.findById(sessionId);
        if (!session) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `Session ${sessionId} not found`
          };
        }

        if (session.status !== SessionStatus.ACTIVE) {
          await this.database.rollbackTransaction();
          return {
            success: false,
            error: `Session ${sessionId} is not active and cannot be cancelled`
          };
        }

        // Update session status to cancelled
        const sessionModel = ParkingSessionModel.fromObject(session);
        sessionModel.cancel();

        await this.sessionRepository.update(sessionModel.toObject());

        // Release the parking space
        const spaceReleased = await this.spaceManager.releaseSpace(session.spaceId);
        if (!spaceReleased) {
          throw new ValidationError(
            `Failed to release parking space ${session.spaceId}`,
            'SPACE_RELEASE_FAILED'
          );
        }

        await this.database.commitTransaction();

        return { success: true };

      } catch (error) {
        await this.database.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: `Session cancellation failed: ${error}`
      };
    }
  }

  /**
   * Validates system consistency (for maintenance purposes)
   */
  async validateSystemConsistency(): Promise<{ isConsistent: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];

      // Get all active sessions
      const activeSessions = await this.getActiveSessions();

      // Check that all active sessions have corresponding occupied spaces
      for (const session of activeSessions) {
        const space = await this.spaceManager.getAllSpaces().then((spaces: any[]) => 
          spaces.find((s: any) => s.spaceId === session.spaceId)
        );

        if (!space) {
          issues.push(`Active session ${session.sessionId} references non-existent space ${session.spaceId}`);
        } else if (!space.isOccupied) {
          issues.push(`Active session ${session.sessionId} references unoccupied space ${session.spaceId}`);
        }
      }

      // Check that occupied spaces have corresponding active sessions
      const allSpaces = await this.spaceManager.getAllSpaces();
      const occupiedSpaces = allSpaces.filter((space: any) => space.isOccupied);

      for (const space of occupiedSpaces) {
        const hasActiveSession = activeSessions.some(session => session.spaceId === space.spaceId);
        if (!hasActiveSession) {
          issues.push(`Occupied space ${space.spaceId} has no corresponding active session`);
        }
      }

      return {
        isConsistent: issues.length === 0,
        issues
      };

    } catch (error) {
      throw new ValidationError(
        `System consistency validation failed: ${error}`,
        'CONSISTENCY_VALIDATION_ERROR'
      );
    }
  }
}