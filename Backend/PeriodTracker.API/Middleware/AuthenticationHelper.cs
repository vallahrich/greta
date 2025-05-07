/// <summary>
/// AuthenticationHelper - Utility class for handling Basic authentication
/// 
/// Provides methods to encode and decode Basic authentication tokens.
/// Basic auth format: "Basic base64(username:password)"
/// 
/// In a production app, this would likely be replaced with JWT or OAuth.
/// </summary>

namespace PeriodTracker.API.Middleware
{
    public static class AuthenticationHelper
    {
        /// <summary>
        /// Encrypts a username and password into a Basic authentication token
        /// </summary>
        /// <param name="username">The user's email</param>
        /// <param name="password">The user's password</param>
        /// <returns>A Basic authentication token string</returns>
        public static string Encrypt(string username, string password)
        {
            // Format: username:password
            string credentials = $"{username}:{password}";
            
            // Convert to bytes for Base64 encoding
            byte[] bytes = System.Text.Encoding.UTF8.GetBytes(credentials);
            
            // Base64 encode the credentials
            string encryptedCredentials = Convert.ToBase64String(bytes);
            
            // Return with 'Basic ' prefix to match HTTP auth format
            return $"Basic {encryptedCredentials}";
        }
        
        /// <summary>
        /// Decrypts a Basic authentication token into username and password
        /// </summary>
        /// <param name="encryptedHeader">The full Basic auth header value</param>
        /// <param name="username">Output parameter for the username</param>
        /// <param name="password">Output parameter for the password</param>
        public static void Decrypt(string encryptedHeader, out string username, out string password)
        {
            // Extract the Base64 part after "Basic "
            var auth = encryptedHeader.Split(' ')[1];
            
            // Decode the Base64 string
            var usernameAndPassword = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(auth));
            
            // Split the string at the colon to get username and password
            var parts = usernameAndPassword.Split(':');
            username = parts[0]; // Email address
            password = parts[1]; // Clear text password
        }
    }
}