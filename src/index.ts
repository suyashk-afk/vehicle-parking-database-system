/**
 * Main entry point for the Vehicle Parking Database System
 */

import { ParkingCLI } from './cli/parking-cli';

async function main() {
  const args = process.argv.slice(2);
  
  // Determine database path
  const dbPath = process.env.DB_PATH || 'parking.db';
  
  try {
    const cli = new ParkingCLI(dbPath);
    await cli.initialize();

    if (args.length > 0) {
      // Command line mode
      const shouldContinue = await cli.processCommand(args);
      if (!shouldContinue) {
        await cli.close();
        process.exit(0);
      }
    } else {
      // Interactive mode
      await cli.startInteractive();
    }
  } catch (error) {
    console.error('❌ System error:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});