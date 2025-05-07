/**
 * Environment Configuration
 * 
 * This file contains environment-specific settings for the application.
 * In a production app, we would have separate files for dev/prod/staging.
 * 
 * Currently it defines:
 * - production flag (false for development)
 * - API URL for backend communication
 */

export const environment = {
  // Set to false for development mode
  production: false,
  
  // Base URL for the backend API (local development server)
  apiUrl: 'http://localhost:5113/api'
};