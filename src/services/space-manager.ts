/**
 * SpaceManager service for parking space allocation and management
 */

import { ISpaceManager, IParkingSpaceRepository } from '../models/interfaces';
import { ParkingSpace, VehicleType, SpaceType, AvailabilityReport } from '../types';
import { ValidationError } from '../utils/validation';

export class SpaceManager implements ISpaceManager {
  constructor(private spaceRepository: IParkingSpaceRepository) {}

  /**
   * Allocates an available parking space for a vehicle type
   */
  async allocateSpace(vehicleType: VehicleType): Promise<ParkingSpace | null> {
    try {
      // Find available spaces that can accommodate this vehicle type
      const availableSpaces = await this.spaceRepository.findAvailableByType(this.mapVehicleToSpaceType(vehicleType));
      
      if (availableSpaces.length === 0) {
        return null; // No available spaces
      }

      // Select the best space (prefer exact match, then larger spaces)
      const selectedSpace = this.selectBestSpace(availableSpaces, vehicleType);
      
      if (!selectedSpace) {
        return null;
      }

      // Mark the space as occupied
      const success = await this.spaceRepository.updateOccupancy(selectedSpace.spaceId, true);
      
      if (!success) {
        throw new ValidationError(
          `Failed to allocate space ${selectedSpace.spaceId}`,
          'SPACE_ALLOCATION_FAILED'
        );
      }

      // Return the updated space
      return {
        ...selectedSpace,
        isOccupied: true
      };

    } catch (error) {
      throw new ValidationError(
        `Space allocation failed: ${error}`,
        'SPACE_ALLOCATION_ERROR'
      );
    }
  }

  /**
   * Releases a parking space
   */
  async releaseSpace(spaceId: string): Promise<boolean> {
    try {
      // Verify the space exists and is currently occupied
      const space = await this.spaceRepository.findById(spaceId);
      
      if (!space) {
        throw new ValidationError(
          `Space ${spaceId} not found`,
          'SPACE_NOT_FOUND'
        );
      }

      if (!space.isOccupied) {
        throw new ValidationError(
          `Space ${spaceId} is already available`,
          'SPACE_ALREADY_AVAILABLE'
        );
      }

      // Mark the space as available
      return await this.spaceRepository.updateOccupancy(spaceId, false);

    } catch (error) {
      throw new ValidationError(
        `Space release failed: ${error}`,
        'SPACE_RELEASE_ERROR'
      );
    }
  }

  /**
   * Gets the number of available spaces for a vehicle type
   */
  async getAvailableSpaces(vehicleType?: VehicleType): Promise<number> {
    try {
      if (vehicleType) {
        const availableSpaces = await this.spaceRepository.findAvailableByType(this.mapVehicleToSpaceType(vehicleType));
        return availableSpaces.length;
      } else {
        const report = await this.spaceRepository.getAvailabilityReport();
        return report.availableSpaces;
      }
    } catch (error) {
      throw new ValidationError(
        `Failed to get available spaces: ${error}`,
        'AVAILABILITY_QUERY_ERROR'
      );
    }
  }

  /**
   * Gets comprehensive availability report
   */
  async getAvailabilityReport(): Promise<AvailabilityReport> {
    try {
      return await this.spaceRepository.getAvailabilityReport();
    } catch (error) {
      throw new ValidationError(
        `Failed to generate availability report: ${error}`,
        'AVAILABILITY_REPORT_ERROR'
      );
    }
  }

  /**
   * Checks if space is available for a vehicle type
   */
  async isSpaceAvailable(vehicleType: VehicleType): Promise<boolean> {
    try {
      const availableCount = await this.getAvailableSpaces(vehicleType);
      return availableCount > 0;
    } catch (error) {
      throw new ValidationError(
        `Failed to check space availability: ${error}`,
        'SPACE_AVAILABILITY_CHECK_ERROR'
      );
    }
  }

  /**
   * Gets spaces by zone
   */
  async getSpacesByZone(zone: string): Promise<ParkingSpace[]> {
    try {
      return await this.spaceRepository.findByZone(zone);
    } catch (error) {
      throw new ValidationError(
        `Failed to get spaces by zone: ${error}`,
        'ZONE_QUERY_ERROR'
      );
    }
  }

  /**
   * Gets all parking spaces
   */
  async getAllSpaces(): Promise<ParkingSpace[]> {
    try {
      return await this.spaceRepository.getAllSpaces();
    } catch (error) {
      throw new ValidationError(
        `Failed to get all spaces: ${error}`,
        'ALL_SPACES_QUERY_ERROR'
      );
    }
  }
  private mapVehicleToSpaceType(vehicleType: VehicleType): SpaceType {
    switch (vehicleType) {
      case VehicleType.CAR:
        return SpaceType.CAR;
      case VehicleType.MOTORCYCLE:
        return SpaceType.MOTORCYCLE;
      case VehicleType.TRUCK:
        return SpaceType.TRUCK;
      case VehicleType.VAN:
        return SpaceType.CAR; // Vans can use car spaces
      default:
        throw new ValidationError(
          `Unsupported vehicle type: ${vehicleType}`,
          'UNSUPPORTED_VEHICLE_TYPE'
        );
    }
  }

  /**
   * Selects the best available space for a vehicle type
   */
  private selectBestSpace(availableSpaces: ParkingSpace[], vehicleType: VehicleType): ParkingSpace | null {
    if (availableSpaces.length === 0) {
      return null;
    }

    // Priority order for space selection
    const spaceTypePriority = this.getSpaceTypePriority(vehicleType);
    
    // Sort spaces by priority (exact match first, then by preference)
    const sortedSpaces = availableSpaces.sort((a, b) => {
      const aPriority = spaceTypePriority.indexOf(a.spaceType);
      const bPriority = spaceTypePriority.indexOf(b.spaceType);
      
      // If both have same priority, sort by space ID for consistency
      if (aPriority === bPriority) {
        return a.spaceId.localeCompare(b.spaceId);
      }
      
      return aPriority - bPriority;
    });

    return sortedSpaces[0];
  }

  /**
   * Gets space type priority for a vehicle type
   */
  private getSpaceTypePriority(vehicleType: VehicleType): SpaceType[] {
    switch (vehicleType) {
      case VehicleType.CAR:
        return [SpaceType.CAR, SpaceType.TRUCK, SpaceType.HANDICAP];
      case VehicleType.MOTORCYCLE:
        return [SpaceType.MOTORCYCLE, SpaceType.HANDICAP];
      case VehicleType.TRUCK:
        return [SpaceType.TRUCK, SpaceType.HANDICAP];
      case VehicleType.VAN:
        return [SpaceType.CAR, SpaceType.TRUCK, SpaceType.HANDICAP];
      default:
        return [];
    }
  }
}