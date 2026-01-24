/**
 * Local Database - Dexie.js (IndexedDB)
 * =====================================
 * Local database for offline capability.
 * Mirrors the MongoDB structure from the backend.
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import Dexie from 'dexie';

/**
 * DigiMasterJi Local Database
 * 
 * Schema mirrors MongoDB collections:
 * - profiles: Student profiles with gamification data
 * - conversations: Chat conversations
 * - messages: Individual messages in conversations
 * - quizzes: Quiz data with questions for offline access and revision
 * - syncMeta: Sync metadata (last sync time, etc.)
 */
class DigiMasterJiDB extends Dexie {
  constructor() {
    super('DigiMasterJiDB');

    // Define database schema
    // Indexed fields are marked with & (unique) or just listed for indexing
    this.version(2).stores({
      // Profiles table
      // Indexed: _id (primary), master_user_id
      profiles: '_id, master_user_id, name, updated_at',

      // Conversations table
      // Indexed: _id (primary), profile_id, updated_at
      conversations: '_id, profile_id, updated_at, created_at',

      // Messages table
      // Indexed: _id (primary), conversation_id, profile_id, timestamp
      messages: '_id, conversation_id, profile_id, timestamp, role',

      // Quizzes table
      // Indexed: _id (primary), profile_id, quiz_date, status
      quizzes: '_id, profile_id, quiz_date, status, completed_at, is_backlog',

      // Sync metadata table
      // Stores sync state information
      syncMeta: 'key',

      // Pending operations (for offline-first)
      // Operations created offline to be synced when online
      pendingOperations: '++id, type, entity, entityId, timestamp, synced',
    });

    // Type definitions for tables
    this.profiles = this.table('profiles');
    this.conversations = this.table('conversations');
    this.messages = this.table('messages');
    this.quizzes = this.table('quizzes');
    this.syncMeta = this.table('syncMeta');
    this.pendingOperations = this.table('pendingOperations');
  }

  /**
   * Clear all data from the database
   */
  async clearAll() {
    await this.profiles.clear();
    await this.conversations.clear();
    await this.messages.clear();
    await this.quizzes.clear();
    await this.syncMeta.clear();
    await this.pendingOperations.clear();
  }

  /**
   * Clear data for a specific user (on logout)
   */
  async clearUserData() {
    await this.profiles.clear();
    await this.conversations.clear();
    await this.messages.clear();
    await this.quizzes.clear();
    // Keep syncMeta for tracking
  }
}

// Create and export singleton instance
export const db = new DigiMasterJiDB();

// Export the class for testing
export { DigiMasterJiDB };

export default db;
