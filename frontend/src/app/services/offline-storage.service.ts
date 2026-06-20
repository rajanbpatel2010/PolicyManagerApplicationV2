import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private readonly DB_NAME = 'policy_manager_db';

  constructor() { }

  /**
   * Initialize the database and create tables
   */
  async initDb() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
      await this.db.open();

      // Create Policies Table
      const policyTableQuery = `
        CREATE TABLE IF NOT EXISTS policies (
          id INTEGER PRIMARY KEY,
          policyNumber TEXT,
          policyHolderName TEXT,
          premiumAmount REAL,
          startDate TEXT,
          endDate TEXT,
          status TEXT,
          policyTypeName TEXT,
          familyMemberName TEXT,
          data TEXT -- Full JSON representation
        );
      `;
      await this.db.execute(policyTableQuery);

      // Create Family Members Table
      const familyTableQuery = `
        CREATE TABLE IF NOT EXISTS family_members (
          id INTEGER PRIMARY KEY,
          name TEXT,
          relationship TEXT,
          data TEXT
        );
      `;
      await this.db.execute(familyTableQuery);

      console.log('Offline SQLite DB initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite DB', error);
    }
  }

  /**
   * Cache policies in local DB
   */
  async savePolicies(policies: any[]) {
    if (!this.db) return;

    try {
      // Clear existing
      await this.db.run('DELETE FROM policies');

      for (const p of policies) {
        const query = `
          INSERT INTO policies (id, policyNumber, policyHolderName, premiumAmount, startDate, endDate, status, policyTypeName, familyMemberName, data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [
          p.id,
          p.policyNumber,
          p.policyHolderName,
          p.premiumAmount,
          p.startDate,
          p.endDate,
          p.status,
          p.policyTypeName,
          p.familyMemberName,
          JSON.stringify(p)
        ];
        await this.db.run(query, values);
      }
    } catch (error) {
      console.error('Error saving policies to SQLite', error);
    }
  }

  /**
   * Retrieve policies from local DB
   */
  async getPolicies(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.query('SELECT data FROM policies');
      return result.values?.map(row => JSON.parse(row.data)) || [];
    } catch (error) {
      console.error('Error fetching policies from SQLite', error);
      return [];
    }
  }

  /**
   * Search policies offline
   */
  async searchPolicies(term: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const query = `
        SELECT data FROM policies 
        WHERE policyNumber LIKE ? OR policyHolderName LIKE ? OR policyTypeName LIKE ?
      `;
      const result = await this.db.query(query, [`%${term}%`, `%${term}%`, `%${term}%`]);
      return result.values?.map(row => JSON.parse(row.data)) || [];
    } catch (error) {
      console.error('Error searching policies in SQLite', error);
      return [];
    }
  }
}
