/**
 * Demo data generator for realistic Indian parking scenarios
 */

import { VehicleType } from '../types';

export interface DemoVehicle {
  licensePlate: string;
  vehicleType: VehicleType;
  entryTime?: Date;
  shouldExit?: boolean;
  exitDelay?: number; // minutes after entry
}

export class DemoDataGenerator {
  
  /**
   * Generates realistic Indian license plates
   */
  static generateIndianLicensePlate(): string {
    const states = ['MH', 'DL', 'KA', 'TN', 'GJ', 'UP', 'RJ', 'WB', 'AP', 'MP', 'HR', 'PB'];
    const state = states[Math.floor(Math.random() * states.length)];
    const district = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
    const series = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const number = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    
    return `${state}${district}${series}${number}`;
  }

  /**
   * Generates realistic demo vehicles for Indian parking scenario
   */
  static generateRealisticDemoVehicles(): DemoVehicle[] {
    const vehicles: DemoVehicle[] = [];
    const now = new Date();

    // Morning commuters (entered 2-4 hours ago, most will exit)
    for (let i = 0; i < 3; i++) {
      const entryTime = new Date(now);
      entryTime.setHours(entryTime.getHours() - (2 + Math.random() * 2));
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      vehicles.push({
        licensePlate: this.generateIndianLicensePlate(),
        vehicleType: VehicleType.CAR,
        entryTime,
        shouldExit: Math.random() > 0.3, // 70% chance to exit
        exitDelay: Math.floor(Math.random() * 30) + 10 // 10-40 minutes
      });
    }

    // Motorcycle commuters (shorter stays)
    for (let i = 0; i < 2; i++) {
      const entryTime = new Date(now);
      entryTime.setHours(entryTime.getHours() - (1 + Math.random() * 2));
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      vehicles.push({
        licensePlate: this.generateIndianLicensePlate(),
        vehicleType: VehicleType.MOTORCYCLE,
        entryTime,
        shouldExit: Math.random() > 0.4, // 60% chance to exit
        exitDelay: Math.floor(Math.random() * 20) + 5 // 5-25 minutes
      });
    }

    // Delivery vehicles (trucks/vans, shorter stays)
    vehicles.push({
      licensePlate: this.generateIndianLicensePlate(),
      vehicleType: VehicleType.TRUCK,
      entryTime: new Date(now.getTime() - (30 + Math.random() * 90) * 60000), // 30-120 minutes ago
      shouldExit: true,
      exitDelay: Math.floor(Math.random() * 15) + 5 // 5-20 minutes
    });

    vehicles.push({
      licensePlate: this.generateIndianLicensePlate(),
      vehicleType: VehicleType.VAN,
      entryTime: new Date(now.getTime() - (45 + Math.random() * 75) * 60000), // 45-120 minutes ago
      shouldExit: Math.random() > 0.5, // 50% chance to exit
      exitDelay: Math.floor(Math.random() * 25) + 10 // 10-35 minutes
    });

    // Long-term parkers (entered hours ago, won't exit in demo)
    for (let i = 0; i < 2; i++) {
      const entryTime = new Date(now);
      entryTime.setHours(entryTime.getHours() - (4 + Math.random() * 4)); // 4-8 hours ago
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      vehicles.push({
        licensePlate: this.generateIndianLicensePlate(),
        vehicleType: Math.random() > 0.5 ? VehicleType.CAR : VehicleType.VAN,
        entryTime,
        shouldExit: false // Long-term parkers stay
      });
    }

    // Recent arrivals (just arrived, won't exit immediately)
    for (let i = 0; i < 3; i++) {
      const entryTime = new Date(now.getTime() - Math.random() * 30 * 60000); // 0-30 minutes ago
      
      vehicles.push({
        licensePlate: this.generateIndianLicensePlate(),
        vehicleType: Math.random() > 0.7 ? VehicleType.MOTORCYCLE : VehicleType.CAR,
        entryTime,
        shouldExit: false // Just arrived
      });
    }

    return vehicles;
  }

  /**
   * Generates realistic revenue scenarios
   */
  static getExpectedRevenueRange(): { min: number; max: number; description: string } {
    return {
      min: 500,
      max: 2500,
      description: "Expected daily revenue for a medium-sized parking facility in India"
    };
  }

  /**
   * Gets realistic parking duration descriptions
   */
  static getParkingDurationScenarios(): string[] {
    return [
      "Short-term shoppers (30 minutes - 2 hours): ₹10-40",
      "Office workers (4-8 hours): ₹80-160", 
      "Long-term visitors (8+ hours): ₹150-200",
      "Delivery vehicles (15-45 minutes): ₹10-30",
      "Event attendees (2-4 hours): ₹40-80"
    ];
  }
}