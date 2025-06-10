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
  email?: string;
  smarthome?: string;
  amazonmusic?: string;
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
   * Get the current authenticated user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
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
  public storeToken(service: 'calendar' | 'health' | 'email' | 'smarthome' | 'amazonmusic', token: string, userId: string): void {
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
      } else if (service === 'email') {
        sessionStorage.setItem(`firebase_oauth_token_${userId}_gmail`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id_gmail', userId);
      } else if (service === 'smarthome') {
        sessionStorage.setItem(`firebase_oauth_token_${userId}_smarthome`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id_smarthome', userId);
      } else if (service === 'amazonmusic') {
        sessionStorage.setItem(`firebase_oauth_token_${userId}_amazonmusic`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id_amazonmusic', userId);
      }
    } catch (error) {
      console.error(`[AuthManager] Failed to store ${service} token:`, error);
    }
  }

  /**
   * Get OAuth token for a service
   */
  public getToken(service: 'calendar' | 'health' | 'email' | 'smarthome' | 'amazonmusic'): string | null {
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
      } else if (service === 'email') {
        const legacyUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_gmail');
        if (legacyUserId === currentUserId) {
          const token = sessionStorage.getItem(`firebase_oauth_token_${currentUserId}_gmail`);
          if (token) {
            console.log(`[AuthManager] Found email token (legacy format)`);
            // Migrate to new format
            this.storeToken('email', token, currentUserId);
            return token;
          }
        }
      } else if (service === 'smarthome') {
        const legacyUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_smarthome');
        if (legacyUserId === currentUserId) {
          const token = sessionStorage.getItem(`firebase_oauth_token_${currentUserId}_smarthome`);
          if (token) {
            console.log(`[AuthManager] Found smart home token (legacy format)`);
            // Migrate to new format
            this.storeToken('smarthome', token, currentUserId);
            return token;
          }
        }
      } else if (service === 'amazonmusic') {
        const legacyUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_amazonmusic');
        if (legacyUserId === currentUserId) {
          const token = sessionStorage.getItem(`firebase_oauth_token_${currentUserId}_amazonmusic`);
          if (token) {
            console.log(`[AuthManager] Found Amazon Music token (legacy format)`);
            // Migrate to new format
            this.storeToken('amazonmusic', token, currentUserId);
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
   * Get best available token (health first, then calendar, then email, then smarthome, then amazonmusic)
   */
  public getBestToken(): string | null {
    return this.getToken('health') || this.getToken('calendar') || this.getToken('email') || this.getToken('smarthome') || this.getToken('amazonmusic');
  }

  /**
   * Validate token by making a test API call
   */
  public async validateToken(service: 'calendar' | 'health' | 'email' | 'smarthome' | 'amazonmusic', token: string): Promise<TokenValidationResult> {
    try {
      let testUrl: string;
      
      if (service === 'calendar') {
        testUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary';
      } else if (service === 'health') {
        testUrl = 'https://www.googleapis.com/fitness/v1/users/me/dataSources';
      } else if (service === 'email') {
        testUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
      } else if (service === 'smarthome') {
        testUrl = 'https://homegraph.googleapis.com/v1/devices:query';
      } else if (service === 'amazonmusic') {
        // Amazon Music uses Login with Amazon (LWA) OAuth tokens
        // Validate by making a test API call
        testUrl = 'https://music-api.amazon.dev/v1/me/profile';
      } else {
        return { isValid: false, needsRefresh: false, error: 'Unknown service' };
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
  public removeToken(service: 'calendar' | 'health' | 'email' | 'smarthome' | 'amazonmusic'): void {
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
      } else if (service === 'email') {
        sessionStorage.removeItem(`firebase_oauth_token_${currentUserId}_gmail`);
        sessionStorage.removeItem('firebase_oauth_token_current_user_id_gmail');
      } else if (service === 'smarthome') {
        sessionStorage.removeItem(`firebase_oauth_token_${currentUserId}_smarthome`);
        sessionStorage.removeItem('firebase_oauth_token_current_user_id_smarthome');
      } else if (service === 'amazonmusic') {
        sessionStorage.removeItem(`firebase_oauth_token_${currentUserId}_amazonmusic`);
        sessionStorage.removeItem('firebase_oauth_token_current_user_id_amazonmusic');
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
    this.removeToken('email');
    this.removeToken('smarthome');
    this.removeToken('amazonmusic');
  }

  /**
   * Check if user has any valid tokens
   */
  public hasAnyToken(): boolean {
    return !!(this.getToken('calendar') || this.getToken('health') || this.getToken('email') || this.getToken('smarthome') || this.getToken('amazonmusic'));
  }

  /**
   * Get all available tokens
   */
  public getAllTokens(): AuthTokens {
    return {
      calendar: this.getToken('calendar') || undefined,
      health: this.getToken('health') || undefined,
      email: this.getToken('email') || undefined,
      smarthome: this.getToken('smarthome') || undefined,
      amazonmusic: this.getToken('amazonmusic') || undefined,
      userId: this.currentUser?.uid,
    };
  }

  /**
   * Auto-validate and refresh tokens
   */
  public async validateAndRefreshTokens(): Promise<{
    calendar: TokenValidationResult | null;
    health: TokenValidationResult | null;
    email: TokenValidationResult | null;
    smarthome: TokenValidationResult | null;
    applemusic: TokenValidationResult | null;
  }> {
    const results = {
      calendar: null as TokenValidationResult | null,
      health: null as TokenValidationResult | null,
      email: null as TokenValidationResult | null,
      smarthome: null as TokenValidationResult | null,
      applemusic: null as TokenValidationResult | null,
    };

    const calendarToken = this.getToken('calendar');
    const healthToken = this.getToken('health');
    const emailToken = this.getToken('email');
    const smartHomeToken = this.getToken('smarthome');
    const amazonMusicToken = this.getToken('amazonmusic');

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

    if (emailToken) {
      results.email = await this.validateToken('email', emailToken);
      if (!results.email.isValid) {
        console.log('[AuthManager] Email token invalid, removing');
        this.removeToken('email');
      }
    }

    if (smartHomeToken) {
      results.smarthome = await this.validateToken('smarthome', smartHomeToken);
      if (!results.smarthome.isValid) {
        console.log('[AuthManager] Smart Home token invalid, removing');
        this.removeToken('smarthome');
      }
    }

    if (amazonMusicToken) {
      results.applemusic = await this.validateToken('amazonmusic', amazonMusicToken);
      if (!results.applemusic.isValid) {
        console.log('[AuthManager] Amazon Music token invalid, removing');
        this.removeToken('amazonmusic');
      }
    }

    return results;
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();
export default authManager;
