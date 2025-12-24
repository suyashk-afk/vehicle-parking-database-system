-- Vehicle Parking Database Schema

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    license_plate TEXT PRIMARY KEY,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parking spaces table
CREATE TABLE IF NOT EXISTS parking_spaces (
    space_id TEXT PRIMARY KEY,
    space_type TEXT NOT NULL CHECK (space_type IN ('CAR', 'MOTORCYCLE', 'TRUCK', 'HANDICAP')),
    zone TEXT NOT NULL,
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parking rates table
CREATE TABLE IF NOT EXISTS parking_rates (
    rate_id TEXT PRIMARY KEY,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN')),
    rate_type TEXT NOT NULL CHECK (rate_type IN ('HOURLY', 'DAILY', 'FLAT')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    effective_from DATETIME NOT NULL,
    effective_until DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (effective_until IS NULL OR effective_until > effective_from)
);

-- Parking sessions table
CREATE TABLE IF NOT EXISTS parking_sessions (
    session_id TEXT PRIMARY KEY,
    license_plate TEXT NOT NULL,
    space_id TEXT NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    calculated_fee DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_plate) REFERENCES vehicles(license_plate),
    FOREIGN KEY (space_id) REFERENCES parking_spaces(space_id),
    CHECK (exit_time IS NULL OR exit_time > entry_time),
    CHECK (calculated_fee IS NULL OR calculated_fee >= 0)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);

CREATE INDEX IF NOT EXISTS idx_spaces_type_occupied ON parking_spaces(space_type, is_occupied);

CREATE INDEX IF NOT EXISTS idx_spaces_zone ON parking_spaces(zone);

CREATE INDEX IF NOT EXISTS idx_rates_vehicle_effective ON parking_rates(vehicle_type, effective_from, effective_until);

CREATE INDEX IF NOT EXISTS idx_sessions_license_plate ON parking_sessions(license_plate);

CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON parking_sessions(entry_time);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON parking_sessions(status);

CREATE INDEX IF NOT EXISTS idx_sessions_space_id ON parking_sessions(space_id);

-- Unique constraint to prevent duplicate active sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session 
ON parking_sessions(license_plate) 
WHERE status = 'ACTIVE';

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_session_timestamp 
AFTER UPDATE ON parking_sessions
BEGIN
    UPDATE parking_sessions 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE session_id = NEW.session_id;
END;