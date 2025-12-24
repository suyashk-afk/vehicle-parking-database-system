/**
 * Core interfaces for the Vehicle Parking Database System
 */

import {
  Vehicle,
  ParkingSpace,
  ParkingSession,
  ParkingRate,
  VehicleType,
  SpaceType,
  AvailabilityReport,
  RevenueReport,
  SearchCriteria
} from '../types';

// Repository Interfaces
export interface IVehicleRepository {
  create(vehicle: Vehicle): Promise<Vehicle>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  update(vehicle: Vehicle): Promise<Vehicle>;
  delete(licensePlate: string): Promise<boolean>;
}

export interface IParkingSpaceRepository {
  create(space: ParkingSpace): Promise<ParkingSpace>;
  findById(spaceId: string): Promise<ParkingSpace | null>;
  findByZone(zone: string): Promise<ParkingSpace[]>;
  findAvailableByType(spaceType: SpaceType): Promise<ParkingSpace[]>;
  updateOccupancy(spaceId: string, isOccupied: boolean): Promise<boolean>;
  getAvailabilityReport(): Promise<AvailabilityReport>;
  getAllSpaces(): Promise<ParkingSpace[]>;
}

export interface IParkingSessionRepository {
  create(session: ParkingSession): Promise<ParkingSession>;
  findById(sessionId: string): Promise<ParkingSession | null>;
  findActiveByLicensePlate(licensePlate: string): Promise<ParkingSession | null>;
  findByLicensePlate(licensePlate: string): Promise<ParkingSession[]>;
  findByCriteria(criteria: SearchCriteria): Promise<ParkingSession[]>;
  update(session: ParkingSession): Promise<ParkingSession>;
  generateRevenueReport(startDate?: Date, endDate?: Date): Promise<RevenueReport>;
}

export interface IParkingRateRepository {
  create(rate: ParkingRate): Promise<ParkingRate>;
  findByVehicleType(vehicleType: VehicleType, effectiveDate?: Date): Promise<ParkingRate | null>;
  findByVehicleAndRateType(vehicleType: VehicleType, rateType: string, effectiveDate?: Date): Promise<ParkingRate | null>;
  findAll(): Promise<ParkingRate[]>;
  findCurrentRates(): Promise<ParkingRate[]>;
  getBestRate(vehicleType: VehicleType, durationMinutes: number, effectiveDate?: Date): Promise<ParkingRate | null>;
  update(rate: ParkingRate): Promise<ParkingRate>;
  delete(rateId: string): Promise<boolean>;
}

// Service Interfaces
export interface ISpaceManager {
  allocateSpace(vehicleType: VehicleType): Promise<ParkingSpace | null>;
  releaseSpace(spaceId: string): Promise<boolean>;
  getAvailableSpaces(vehicleType?: VehicleType): Promise<number>;
  getAvailabilityReport(): Promise<AvailabilityReport>;
  isSpaceAvailable(vehicleType: VehicleType): Promise<boolean>;
  getAllSpaces(): Promise<ParkingSpace[]>;
}

export interface IFeeCalculator {
  calculateFee(entryTime: Date, exitTime: Date, vehicleType: VehicleType): Promise<number>;
  updateRates(rates: ParkingRate[]): Promise<void>;
  getRateStructure(): Promise<ParkingRate[]>;
  validateRate(rate: ParkingRate): boolean;
}

export interface IParkingManager {
  enterVehicle(vehicle: Vehicle): Promise<{ success: boolean; session?: ParkingSession; error?: string }>;
  exitVehicle(licensePlate: string): Promise<{ success: boolean; session?: ParkingSession; fee?: number; error?: string }>;
  getAvailability(): Promise<AvailabilityReport>;
  searchSessions(criteria: SearchCriteria): Promise<ParkingSession[]>;
  generateReport(startDate?: Date, endDate?: Date): Promise<RevenueReport>;
}

// Database Interface
export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  execute(query: string, params?: any[]): Promise<any>;
  query(query: string, params?: any[]): Promise<any[]>;
}