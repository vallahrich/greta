/**
 * User Model - Represents a user account
 * 
 * This interface defines the structure of user data throughout the application.
 * It matches the C# User entity on the backend.
 */
export interface User {
    userId: number;      // Primary key
    name: string;        // Display name
    email: string;       // Email address (also used for login)
    pw: string;          // Password (should be handled securely)
    createdAt: Date;     // Account creation timestamp
}