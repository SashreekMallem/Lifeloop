/**
 * Centralized Authentication Manager
 * Handles OAuth token storage, validation, and persistence across app sessions
 */

import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase/client';

const auth = getAuth(app);

interface AuthTokens {
  calendar?: string;
  health?: string;
  userId?: string;
}

interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  private constructor() {
    // Set up persistent auth state monitoring
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(listener => listener(user));
      
      if (!user) {
        // User signed out, clear all tokens
        this.clearAllTokens();
      }
    });
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Add listener for auth state changes
   */
  public onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Store OAuth token securely with user association
   */
  public storeToken(service: 'calendar' | 'health', token: string, userId: string): void {
    try {
      console.log(`[AuthManager] Storing ${service} token for user:`, userId);
      
      // Store the token with user association
      sessionStorage.setItem(`lifeloop_${service}_token_${userId}`, token);
      sessionStorage.setItem(`lifeloop_${service}_user_id`, userId);
      
      // Also store in legacy format for backward compatibility
      if (service === 'calendar') {
        sessionStorage.setItem(`firebase_oauth_token_${userId}`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id', userId);
      } else if (service === 'health') {
        sessionStorage.setItem(`firebase_oauth_token_${userId}_fit`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id_fit', userId);
      }
    } catch (error) {
      console.error(`[AuthManager] Failed to store ${service} token:`, error);
    }
  }

  /**
   * Get OAuth token for a service
   */
  public getToken(service: 'calendar' | 'health'): string | null {
    try {
      const currentUserId = this.currentUser?.uid;
      if (!currentUserId) {
        console.log(`[AuthManager] No current user for ${service} token`);
        return null;
      }

      // Try new format first
      const storedUserId = sessionStorage.getItem(`lifeloop_${service}_user_id`);
      if (storedUserId === currentUserId) {
        const token = sessionStorage.getItem(`lifeloop_${service}_token_${currentUserId}`);
        if (token) {
          console.log(`[AuthManager] Found ${service} token (new format)`);
          return token;
        }
      }

      // Fallback to legacy format
      if (service === 'calendar') {
        const legacyUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
        if (legacyUserId === currentUserId) {
          const token = sessionStorage.getItem(`firebase_oauth_token_${currentUserId}`);
          if (token) {
            console.log(`[AuthManager] Found calendar token (legacy format)`);
            // Migrate to new format
            this.storeToken('calendar', token, currentUserId);
            return token;
          }
        }
      } else if (service === 'health') {
        const legacyUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_fit');
        if (legacyUserId === currentUserId) {
          const token = sessionStorage.getItem(`firebase_oauth_token_${currentUserId}_fit`);
          if (token) {
            console.log(`[AuthManager] Found health token (legacy format)`);
            // Migrate to new format
            this.storeToken('health', token, currentUserId);
            return token;
          }
        }
      }

      console.log(`[AuthManager] No ${service} token found for current user`);
      return null;
    } catch (error) {
      console.error(`[AuthManager] Error getting ${service} token:`, error);
      return null;
    }
  }

  /**
   * Get best available token (health first, then calendar)
   */
  public getBestToken(): string | null {
    return this.getToken('health') || this.getToken('calendar');
  }

  /**
   * Validate token by making a test API call
   */
  public async validateToken(service: 'calendar' | 'health', token: string): Promise<TokenValidationResult> {
    try {
      let testUrl: string;
      
      if (service === 'calendar') {
        testUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary';
      } else {
        testUrl = 'https://www.googleapis.com/fitness/v1/users/me/dataSources';
      }

      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return { isValid: true, needsRefresh: false };
      } else if (response.status === 401) {
        return { isValid: false, needsRefresh: true, error: 'Token expired' };
      } else {
        return { isValid: false, needsRefresh: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      return { isValid: false, needsRefresh: false, error: `Network error: ${error}` };
    }
  }

  /**
   * Remove token for a service
   */
  public removeToken(service: 'calendar' | 'health'): void {
    try {
      const currentUserId = this.currentUser?.uid;
      if (!currentUserId) return;

      console.log(`[AuthManager] Removing ${service} token`);

      // Remove new format
      sessionStorage.removeItem(`lifeloop_${service}_token_${currentUserId}`);
      sessionStorage.removeItem(`lifeloop_${service}_user_id`);

      // Remove legacy format
      if (service === 'calendar') {
        sessionStorage.removeItem(`firebase_oauth_token_${currentUserId}`);
        sessionStorage.removeItem('firebase_oauth_token_current_user_id');
      } else if (service === 'health') {
        sessionStorage.removeItem(`firebase_oauth_token_${currentUserId}_fit`);
        sessionStorage.removeItem('firebase_oauth_token_current_user_id_fit');
      }
    } catch (error) {
      console.error(`[AuthManager] Error removing ${service} token:`, error);
    }
  }

  /**
   * Clear all tokens
   */
  public clearAllTokens(): void {
    console.log('[AuthManager] Clearing all tokens');
    this.removeToken('calendar');
    this.removeToken('health');
  }

  /**
   * Check if user has any valid tokens
   */
  public hasAnyToken(): boolean {
    return !!(this.getToken('calendar') || this.getToken('health'));
  }

  /**
   * Get all available tokens
   */
  public getAllTokens(): AuthTokens {
    return {
      calendar: this.getToken('calendar') || undefined,
      health: this.getToken('health') || undefined,
      userId: this.currentUser?.uid,
    };
  }

  /**
   * Auto-validate and refresh tokens
   */
  public async validateAndRefreshTokens(): Promise<{
    calendar: TokenValidationResult | null;
    health: TokenValidationResult | null;
  }> {
    const results = {
      calendar: null as TokenValidationResult | null,
      health: null as TokenValidationResult | null,
    };

    const calendarToken = this.getToken('calendar');
    const healthToken = this.getToken('health');

    if (calendarToken) {
      results.calendar = await this.validateToken('calendar', calendarToken);
      if (!results.calendar.isValid) {
        console.log('[AuthManager] Calendar token invalid, removing');
        this.removeToken('calendar');
      }
    }

    if (healthToken) {
      results.health = await this.validateToken('health', healthToken);
      if (!results.health.isValid) {
        console.log('[AuthManager] Health token invalid, removing');
        this.removeToken('health');
      }
    }

    return results;
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();
export default authManager;
