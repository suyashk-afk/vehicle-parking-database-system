/**
 * CLI input validation utilities
 */

import { VehicleType } from '../types';
import { validateLicensePlate } from '../utils/validation';

export class CLIValidator {
  
  /**
   * Validates vehicle entry command arguments
   */
  static validateEnterCommand(args: string[]): { isValid: boolean; error?: string } {
    if (args.length !== 3) {
      return {
        isValid: false,
        error: 'Usage: enter <license-plate> <vehicle-type>\nExample: enter ABC123 CAR'
      };
    }

    const [, licensePlate, vehicleType] = args;

    // Validate license plate
    if (!validateLicensePlate(licensePlate)) {
      return {
        isValid: false,
        error: `Invalid license plate format: ${licensePlate}\nLicense plate must be 6-8 alphanumeric characters`
      };
    }

    // Validate vehicle type
    if (!Object.values(VehicleType).includes(vehicleType.toUpperCase() as VehicleType)) {
      return {
        isValid: false,
        error: `Invalid vehicle type: ${vehicleType}\nValid types: ${Object.values(VehicleType).join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validates vehicle exit command arguments
   */
  static validateExitCommand(args: string[]): { isValid: boolean; error?: string } {
    if (args.length !== 2) {
      return {
        isValid: false,
        error: 'Usage: exit <license-plate>\nExample: exit ABC123'
      };
    }

    const [, licensePlate] = args;

    // Validate license plate
    if (!validateLicensePlate(licensePlate)) {
      return {
        isValid: false,
        error: `Invalid license plate format: ${licensePlate}\nLicense plate must be 6-8 alphanumeric characters`
      };
    }

    return { isValid: true };
  }

  /**
   * Validates search command arguments
   */
  static validateSearchCommand(args: string[]): { isValid: boolean; error?: string } {
    if (args.length !== 2) {
      return {
        isValid: false,
        error: 'Usage: search <license-plate>\nExample: search ABC123'
      };
    }

    const [, licensePlate] = args;

    // Validate license plate
    if (!validateLicensePlate(licensePlate)) {
      return {
        isValid: false,
        error: `Invalid license plate format: ${licensePlate}\nLicense plate must be 6-8 alphanumeric characters`
      };
    }

    return { isValid: true };
  }

  /**
   * Validates report command arguments
   */
  static validateReportCommand(args: string[]): { isValid: boolean; error?: string; days?: number } {
    if (args.length > 2) {
      return {
        isValid: false,
        error: 'Usage: report [days]\nExample: report 7 (for last 7 days) or report (for all time)'
      };
    }

    if (args.length === 2) {
      const days = parseInt(args[1]);
      if (isNaN(days) || days <= 0) {
        return {
          isValid: false,
          error: 'Days must be a positive number\nExample: report 7'
        };
      }
      return { isValid: true, days };
    }

    return { isValid: true };
  }

  /**
   * Provides command suggestions for typos
   */
  static suggestCommand(input: string): string[] {
    const commands = ['enter', 'exit', 'availability', 'active', 'search', 'report', 'help', 'quit'];
    const suggestions: string[] = [];

    // Simple fuzzy matching
    for (const command of commands) {
      if (command.includes(input.toLowerCase()) || input.toLowerCase().includes(command)) {
        suggestions.push(command);
      }
    }

    // Levenshtein distance for better suggestions
    if (suggestions.length === 0) {
      for (const command of commands) {
        if (this.levenshteinDistance(input.toLowerCase(), command) <= 2) {
          suggestions.push(command);
        }
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Formats error messages with helpful context
   */
  static formatError(error: string, command?: string): string {
    let formatted = `❌ ${error}`;
    
    if (command) {
      formatted += `\n\n💡 For help with the '${command}' command, type: help`;
    }
    
    formatted += '\n💡 Type "help" to see all available commands';
    
    return formatted;
  }

  /**
   * Validates and normalizes license plate input
   */
  static normalizeLicensePlate(licensePlate: string): string {
    return licensePlate.replace(/\s/g, '').toUpperCase();
  }

  /**
   * Validates numeric input
   */
  static validateNumericInput(input: string, fieldName: string, min?: number, max?: number): { isValid: boolean; error?: string; value?: number } {
    const value = parseFloat(input);
    
    if (isNaN(value)) {
      return {
        isValid: false,
        error: `${fieldName} must be a valid number`
      };
    }

    if (min !== undefined && value < min) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${min}`
      };
    }

    if (max !== undefined && value > max) {
      return {
        isValid: false,
        error: `${fieldName} must be at most ${max}`
      };
    }

    return { isValid: true, value };
  }
}