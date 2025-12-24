/**
 * CLI help system with detailed command documentation
 */

export class CLIHelp {
  
  /**
   * Shows general help information
   */
  static showGeneralHelp(): void {
    console.log('\n🅿️  Vehicle Parking Database System');
    console.log('===================================');
    console.log('A comprehensive parking management system with real-time space tracking,');
    console.log('automated fee calculation, and detailed reporting capabilities.');
    console.log('');
    console.log('📋 Available Commands:');
    console.log('');
    console.log('🚗 Vehicle Operations:');
    console.log('  enter <license-plate> <vehicle-type>  - Enter vehicle into parking facility');
    console.log('  exit <license-plate>                  - Process vehicle exit and calculate fees');
    console.log('');
    console.log('📊 Information & Reports:');
    console.log('  availability                          - Show current parking space availability');
    console.log('  active                               - List all active parking sessions');
    console.log('  search <license-plate>               - Search parking history by license plate');
    console.log('  report [days]                        - Generate revenue and usage reports');
    console.log('');
    console.log('🔧 System Commands:');
    console.log('  help [command]                       - Show help (general or command-specific)');
    console.log('  quit                                 - Exit the parking system');
    console.log('');
    console.log('📝 Vehicle Types: CAR, MOTORCYCLE, TRUCK, VAN');
    console.log('📝 License Plate Format: 6-8 alphanumeric characters (e.g., ABC123, XYZ789)');
    console.log('');
    console.log('💡 Examples:');
    console.log('  enter ABC123 CAR                     - Park a car with license ABC123');
    console.log('  exit ABC123                          - Process exit for vehicle ABC123');
    console.log('  report 7                             - Generate report for last 7 days');
    console.log('');
    console.log('💡 For detailed help on a specific command, type: help <command>');
    console.log('');
  }

  /**
   * Shows help for the enter command
   */
  static showEnterHelp(): void {
    console.log('\n🚗 ENTER Command Help');
    console.log('=====================');
    console.log('Registers a vehicle entering the parking facility and assigns a parking space.');
    console.log('');
    console.log('📝 Usage:');
    console.log('  enter <license-plate> <vehicle-type>');
    console.log('');
    console.log('📋 Parameters:');
    console.log('  license-plate    License plate of the vehicle (6-8 alphanumeric characters)');
    console.log('  vehicle-type     Type of vehicle: CAR, MOTORCYCLE, TRUCK, or VAN');
    console.log('');
    console.log('✅ Examples:');
    console.log('  enter ABC123 CAR                     - Park a car');
    console.log('  enter XYZ789 MOTORCYCLE              - Park a motorcycle');
    console.log('  enter TRUCK01 TRUCK                  - Park a truck');
    console.log('');
    console.log('📊 What happens:');
    console.log('  • Validates vehicle information');
    console.log('  • Checks for available parking spaces');
    console.log('  • Assigns the best available space');
    console.log('  • Creates a new parking session');
    console.log('  • Records entry time and details');
    console.log('');
    console.log('❌ Common errors:');
    console.log('  • Invalid license plate format');
    console.log('  • Unsupported vehicle type');
    console.log('  • No available spaces for vehicle type');
    console.log('  • Vehicle already has active session');
    console.log('');
  }

  /**
   * Shows help for the exit command
   */
  static showExitHelp(): void {
    console.log('\n🚪 EXIT Command Help');
    console.log('====================');
    console.log('Processes vehicle exit, calculates parking fees, and releases the parking space.');
    console.log('');
    console.log('📝 Usage:');
    console.log('  exit <license-plate>');
    console.log('');
    console.log('📋 Parameters:');
    console.log('  license-plate    License plate of the vehicle to exit');
    console.log('');
    console.log('✅ Examples:');
    console.log('  exit ABC123                          - Process exit for vehicle ABC123');
    console.log('  exit XYZ789                          - Process exit for vehicle XYZ789');
    console.log('');
    console.log('📊 What happens:');
    console.log('  • Finds the active parking session');
    console.log('  • Calculates parking duration');
    console.log('  • Determines applicable parking rates');
    console.log('  • Calculates total parking fee');
    console.log('  • Releases the parking space');
    console.log('  • Completes the parking session');
    console.log('');
    console.log('💰 Fee Calculation:');
    console.log('  • Based on vehicle type and duration');
    console.log('  • Uses best available rate (hourly/daily/flat)');
    console.log('  • Rounds up to next billing unit');
    console.log('');
    console.log('❌ Common errors:');
    console.log('  • No active session for license plate');
    console.log('  • Invalid license plate format');
    console.log('  • Vehicle not found in system');
    console.log('');
  }

  /**
   * Shows help for the availability command
   */
  static showAvailabilityHelp(): void {
    console.log('\n📊 AVAILABILITY Command Help');
    console.log('============================');
    console.log('Displays current parking space availability and utilization statistics.');
    console.log('');
    console.log('📝 Usage:');
    console.log('  availability');
    console.log('');
    console.log('📋 Information Displayed:');
    console.log('  • Total facility capacity');
    console.log('  • Currently occupied spaces');
    console.log('  • Available spaces');
    console.log('  • Utilization percentage');
    console.log('  • Breakdown by vehicle type');
    console.log('  • Breakdown by parking zone');
    console.log('');
    console.log('✅ Example Output:');
    console.log('  Total Capacity: 20');
    console.log('  Occupied Spaces: 12');
    console.log('  Available Spaces: 8');
    console.log('  Utilization: 60.0%');
    console.log('');
    console.log('💡 Use this command to:');
    console.log('  • Check space availability before directing vehicles');
    console.log('  • Monitor facility utilization');
    console.log('  • Identify which zones or vehicle types have availability');
    console.log('');
  }

  /**
   * Shows help for the search command
   */
  static showSearchHelp(): void {
    console.log('\n🔍 SEARCH Command Help');
    console.log('======================');
    console.log('Searches and displays parking history for a specific vehicle.');
    console.log('');
    console.log('📝 Usage:');
    console.log('  search <license-plate>');
    console.log('');
    console.log('📋 Parameters:');
    console.log('  license-plate    License plate to search for');
    console.log('');
    console.log('✅ Examples:');
    console.log('  search ABC123                        - Show all sessions for ABC123');
    console.log('  search XYZ789                        - Show all sessions for XYZ789');
    console.log('');
    console.log('📊 Information Displayed:');
    console.log('  • Session ID and status');
    console.log('  • Assigned parking space');
    console.log('  • Entry and exit times');
    console.log('  • Parking duration');
    console.log('  • Calculated fees (for completed sessions)');
    console.log('');
    console.log('💡 Use this command to:');
    console.log('  • Review parking history');
    console.log('  • Resolve billing disputes');
    console.log('  • Track vehicle usage patterns');
    console.log('  • Verify session details');
    console.log('');
  }

  /**
   * Shows help for the report command
   */
  static showReportHelp(): void {
    console.log('\n📈 REPORT Command Help');
    console.log('======================');
    console.log('Generates revenue and usage reports for analysis and business insights.');
    console.log('');
    console.log('📝 Usage:');
    console.log('  report [days]');
    console.log('');
    console.log('📋 Parameters:');
    console.log('  days            Optional: Number of days to include (default: all time)');
    console.log('');
    console.log('✅ Examples:');
    console.log('  report                               - Generate report for all time');
    console.log('  report 7                             - Generate report for last 7 days');
    console.log('  report 30                            - Generate report for last 30 days');
    console.log('');
    console.log('📊 Report Contents:');
    console.log('  • Total revenue generated');
    console.log('  • Number of completed sessions');
    console.log('  • Average parking duration');
    console.log('  • Peak usage times by hour');
    console.log('');
    console.log('💡 Use reports to:');
    console.log('  • Track business performance');
    console.log('  • Identify peak usage patterns');
    console.log('  • Plan staffing and resources');
    console.log('  • Analyze revenue trends');
    console.log('');
  }

  /**
   * Shows help for the active command
   */
  static showActiveHelp(): void {
    console.log('\n🚗 ACTIVE Command Help');
    console.log('======================');
    console.log('Lists all currently active parking sessions in the facility.');
    console.log('');
    console.log('📝 Usage:');
    console.log('  active');
    console.log('');
    console.log('📊 Information Displayed:');
    console.log('  • Session ID');
    console.log('  • Vehicle license plate');
    console.log('  • Assigned parking space');
    console.log('  • Entry time');
    console.log('  • Current parking duration');
    console.log('');
    console.log('💡 Use this command to:');
    console.log('  • Monitor current occupancy');
    console.log('  • Identify long-term parkers');
    console.log('  • Verify space assignments');
    console.log('  • Track session durations');
    console.log('');
    console.log('📋 Note:');
    console.log('  Only shows sessions with status "ACTIVE"');
    console.log('  Completed and cancelled sessions are not included');
    console.log('');
  }

  /**
   * Shows command-specific help
   */
  static showCommandHelp(command: string): void {
    switch (command.toLowerCase()) {
      case 'enter':
        this.showEnterHelp();
        break;
      case 'exit':
        this.showExitHelp();
        break;
      case 'availability':
        this.showAvailabilityHelp();
        break;
      case 'search':
        this.showSearchHelp();
        break;
      case 'report':
        this.showReportHelp();
        break;
      case 'active':
        this.showActiveHelp();
        break;
      default:
        console.log(`❌ No help available for command: ${command}`);
        console.log('💡 Available commands: enter, exit, availability, active, search, report');
        console.log('💡 Type "help" for general help');
        break;
    }
  }

  /**
   * Shows system information and status
   */
  static showSystemInfo(): void {
    console.log('\n🔧 System Information');
    console.log('=====================');
    console.log('Vehicle Parking Database System v1.0.0');
    console.log('');
    console.log('🏗️  Features:');
    console.log('  • Real-time space allocation and tracking');
    console.log('  • Automated fee calculation with multiple rate types');
    console.log('  • Comprehensive session management');
    console.log('  • Detailed reporting and analytics');
    console.log('  • Multi-vehicle type support');
    console.log('  • Zone-based space organization');
    console.log('');
    console.log('🚗 Supported Vehicle Types:');
    console.log('  • CAR - Standard passenger vehicles');
    console.log('  • MOTORCYCLE - Two-wheeled vehicles');
    console.log('  • TRUCK - Large commercial vehicles');
    console.log('  • VAN - Medium-sized commercial vehicles');
    console.log('');
    console.log('💰 Rate Types:');
    console.log('  • HOURLY - Charged per hour (rounded up)');
    console.log('  • DAILY - Charged per day (rounded up)');
    console.log('  • FLAT - Fixed rate regardless of duration');
    console.log('');
  }
}