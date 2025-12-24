/**
 * Core type definitions for the Vehicle Parking Database System
 */

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  VAN = 'VAN'
}

export enum SpaceType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  HANDICAP = 'HANDICAP'
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RateType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  FLAT = 'FLAT'
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface Vehicle {
  licensePlate: string;
  vehicleType: VehicleType;
  createdAt: Date;
}

export interface ParkingSpace {
  spaceId: string;
  spaceType: SpaceType;
  zone: string;
  isOccupied: boolean;
  createdAt: Date;
}

export interface ParkingSession {
  sessionId: string;
  licensePlate: string;
  spaceId: string;
  entryTime: Date;
  exitTime?: Date | undefined;
  calculatedFee?: number | undefined;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingRate {
  rateId: string;
  vehicleType: VehicleType;
  rateType: RateType;
  amount: number;
  effectiveFrom: Date;
  effectiveUntil?: Date | undefined;
  createdAt: Date;
}

export interface AvailabilityReport {
  totalCapacity: number;
  occupiedSpaces: number;
  availableSpaces: number;
  utilizationPercentage: number;
  spacesByType: Record<SpaceType, { total: number; occupied: number; available: number }>;
  spacesByZone: Record<string, { total: number; occupied: number; available: number }>;
}

export interface RevenueReport {
  totalRevenue: number;
  averageParkingDuration: number;
  peakUsageTimes: Array<{ hour: number; count: number }>;
  sessionCount: number;
}

export interface SearchCriteria {
  licensePlate?: string;
  vehicleType?: VehicleType;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
  minFee?: number;
  maxFee?: number;
}