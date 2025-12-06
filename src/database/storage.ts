// Simple in-memory storage for demo purposes
// In production, use a real database like PostgreSQL, MongoDB, etc.

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  name: string;
  createdAt: Date;
  expiresAt: Date | null;
  revoked: boolean;
  lastUsedAt: Date | null;
}

export class InMemoryStorage {
  private static users: Map<string, User> = new Map();
  private static apiKeys: Map<string, ApiKey> = new Map();

  // User methods
  static createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  static findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  static findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  static getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // API Key methods
  static createApiKey(apiKey: ApiKey): ApiKey {
    this.apiKeys.set(apiKey.key, apiKey);
    return apiKey;
  }

  static findApiKeyByKey(key: string): ApiKey | undefined {
    return this.apiKeys.get(key);
  }

  static findApiKeysByUserId(userId: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter((k) => k.userId === userId);
  }

  static updateApiKey(key: string, updates: Partial<ApiKey>): ApiKey | null {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) return null;

    const updated = { ...apiKey, ...updates };
    this.apiKeys.set(key, updated);
    return updated;
  }

  static getAllApiKeys(): ApiKey[] {
    return Array.from(this.apiKeys.values());
  }

  // Clear all data (useful for testing)
  static clear() {
    this.users.clear();
    this.apiKeys.clear();
  }
}
