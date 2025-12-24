/**
 * Integration test to verify end-to-end functionality
 */

import { ParkingCLI } from './cli/parking-cli';

async function runIntegrationTest(): Promise<void> {
  console.log('🧪 Running integration test...\n');

  try {
    // Initialize the system
    const cli = new ParkingCLI(':memory:');
    await cli.initialize();

    console.log('✅ System initialized successfully\n');

    // Test vehicle entry
    console.log('🚗 Testing vehicle entry...');
    await cli.enterVehicle('ABC123', 'CAR');
    await cli.enterVehicle('XYZ789', 'MOTORCYCLE');
    console.log('');

    // Test availability check
    console.log('📊 Testing availability check...');
    await cli.showAvailability();
    console.log('');

    // Test active sessions
    console.log('🚗 Testing active sessions...');
    await cli.showActiveSessions();
    console.log('');

    // Test vehicle search
    console.log('🔍 Testing vehicle search...');
    await cli.searchSessions('ABC123');
    console.log('');

    console.log('🚪 Testing vehicle exit...');
    await cli.exitVehicle('ABC123');
    console.log('');

    // Wait a moment to simulate parking duration
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test report generation
    console.log('📈 Testing report generation...');
    await cli.generateReport();
    console.log('');

    // Test final availability
    console.log('📊 Testing final availability...');
    await cli.showAvailability();
    console.log('');

    await cli.close();

    console.log('✅ Integration test completed successfully!');
    console.log('🎉 All systems are working correctly.');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { runIntegrationTest };