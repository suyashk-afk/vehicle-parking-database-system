/**
 * Base repository with common database operations
 */

import { IDatabase } from '../models/interfaces';

export abstract class BaseRepository {
  constructor(protected database: IDatabase) {}

  /**
   * Executes a database query with error handling
   */
  protected async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      return await this.database.execute(query, params);
    } catch (error) {
      throw new Error(`Database execution error: ${error}`);
    }
  }

  /**
   * Executes a database query that returns multiple rows
   */
  protected async queryMultiple(query: string, params: any[] = []): Promise<any[]> {
    try {
      return await this.database.query(query, params);
    } catch (error) {
      throw new Error(`Database query error: ${error}`);
    }
  }

  /**
   * Executes a database query that returns a single row
   */
  protected async queryOne(query: string, params: any[] = []): Promise<any | null> {
    try {
      const rows = await this.database.query(query, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Database query error: ${error}`);
    }
  }

  /**
   * Begins a transaction
   */
  protected async beginTransaction(): Promise<void> {
    await this.database.beginTransaction();
  }

  /**
   * Commits a transaction
   */
  protected async commitTransaction(): Promise<void> {
    await this.database.commitTransaction();
  }

  /**
   * Rolls back a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    await this.database.rollbackTransaction();
  }

  /**
   * Executes a function within a transaction
   */
  protected async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await operation();
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  /**
   * Converts database row to Date object
   */
  protected parseDate(dateString: string | null): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
  }

  /**
   * Converts Date object to database string
   */
  protected formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Converts database boolean (0/1) to JavaScript boolean
   */
  protected parseBoolean(value: number | boolean): boolean {
    return Boolean(value);
  }

  /**
   * Validates that required fields are present
   */
  protected validateRequiredFields(obj: any, fields: string[]): void {
    for (const field of fields) {
      if (obj[field] === undefined || obj[field] === null) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
  }
}