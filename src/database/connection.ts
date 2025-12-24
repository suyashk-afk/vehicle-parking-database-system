/**
 * Database connection and configuration
 */

import * as sqlite3 from 'sqlite3';
import { IDatabase } from '../models/interfaces';

export class DatabaseConnection implements IDatabase {
  private db: sqlite3.Database | null = null;
  private transactionActive: boolean = false;

  constructor(private dbPath: string = ':memory:') {}

  /**
   * Connects to the database
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to database: ${err.message}`));
        } else {
          // Enable foreign key constraints
          this.db!.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
              reject(new Error(`Failed to enable foreign keys: ${err.message}`));
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Disconnects from the database
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(new Error(`Failed to close database: ${err.message}`));
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Begins a database transaction
   */
  async beginTransaction(): Promise<void> {
    if (this.transactionActive) {
      throw new Error('Transaction already active');
    }
    
    await this.execute('BEGIN TRANSACTION');
    this.transactionActive = true;
  }

  /**
   * Commits the current transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to commit');
    }
    
    await this.execute('COMMIT');
    this.transactionActive = false;
  }

  /**
   * Rolls back the current transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to rollback');
    }
    
    try {
      await this.execute('ROLLBACK');
    } finally {
      this.transactionActive = false;
    }
  }

  /**
   * Executes a query that doesn't return data (INSERT, UPDATE, DELETE)
   */
  async execute(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(query, params, function(err) {
        if (err) {
          reject(new Error(`Database execution error: ${err.message}`));
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  /**
   * Executes a query that returns data (SELECT)
   */
  async query(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(new Error(`Database query error: ${err.message}`));
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Executes a query that returns a single row
   */
  async queryOne(query: string, params: any[] = []): Promise<any | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(new Error(`Database query error: ${err.message}`));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Checks if database is connected
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Checks if transaction is active
   */
  isTransactionActive(): boolean {
    return this.transactionActive;
  }
}