# Vehicle Parking Database System

A comprehensive parking facility management system with real-time space tracking, automated fee calculation, and detailed reporting capabilities.

## 🎓 For College Exhibition

### Quick Start for Demo
```bash
npm install
npm run exhibition
```
Then open `http://localhost:3000` in your browser for the live dashboard!

**Perfect for demonstrating to professors and visitors with:**
- 🌐 **Live Web Dashboard** - Real-time updates every 5 seconds
- 🎯 **Demo Controls** - Populate/reset data for presentations  
- 📊 **Visual Interface** - Charts, graphs, and interactive elements
- 🚀 **Professional Look** - Impressive visual presentation

See `EXHIBITION_GUIDE.md` and `DEMO_SCRIPT.md` for detailed presentation tips!

## Features

- **Real-time Space Management**: Track parking space availability by vehicle type and zone
- **Automated Fee Calculation**: Support for hourly, daily, and flat rate pricing models
- **Session Management**: Complete parking session lifecycle from entry to exit
- **Multi-Vehicle Support**: Handle cars, motorcycles, trucks, and vans
- **Comprehensive Reporting**: Revenue reports and usage analytics
- **CLI Interface**: Easy-to-use command-line interface for all operations
- **Data Validation**: Robust input validation and error handling
- **Transaction Integrity**: Database transactions ensure data consistency

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Interactive Mode
Start the interactive CLI:
```bash
npm start
```

### Command Line Mode
Execute single commands:
```bash
npm start enter ABC123 CAR
npm start exit ABC123
npm start availability
```

## Available Commands

### Vehicle Operations
- `enter <license-plate> <vehicle-type>` - Enter vehicle into parking
- `exit <license-plate>` - Process vehicle exit and calculate fees

### Information & Reports
- `availability` - Show current parking space availability
- `active` - List all active parking sessions
- `search <license-plate>` - Search parking history by license plate
- `report [days]` - Generate revenue and usage reports

### System Commands
- `help [command]` - Show help (general or command-specific)
- `info` - Show system information
- `quit` - Exit the system

## Vehicle Types

- **CAR** - Standard passenger vehicles
- **MOTORCYCLE** - Two-wheeled vehicles  
- **TRUCK** - Large commercial vehicles
- **VAN** - Medium-sized commercial vehicles

## Rate Types

- **HOURLY** - Charged per hour (rounded up)
- **DAILY** - Charged per day (rounded up)
- **FLAT** - Fixed rate regardless of duration

## Examples

```bash
# Enter a car
enter ABC123 CAR

# Exit the vehicle
exit ABC123

# Check availability
availability

# Search vehicle history
search ABC123

# Generate 7-day report
report 7

# Get help for specific command
help enter
```

## Database

The system uses SQLite for data storage with the following tables:
- `vehicles` - Vehicle information
- `parking_spaces` - Space definitions and occupancy
- `parking_sessions` - Complete session records
- `parking_rates` - Pricing configuration

## Development

### Scripts
- `npm run exhibition` - **Start web demo for college exhibition**
- `npm run web` - Start web interface only
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run CLI in development mode
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure
```
src/
├── models/           # Data models and interfaces
├── services/         # Business logic services
├── repositories/     # Data access layer
├── database/         # Database configuration and migrations
├── cli/             # Command-line interface
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## Configuration

Set environment variables:
- `DB_PATH` - Database file path (default: 'parking.db')

## Error Handling

The system provides comprehensive error handling with:
- Input validation for all commands
- Meaningful error messages
- Transaction rollback on failures
- Graceful handling of edge cases

## License

MIT License - see LICENSE file for details.