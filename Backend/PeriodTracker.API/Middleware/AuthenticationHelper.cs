namespace PeriodTracker.API.Middleware
{
    // Helper for Basic Auth: encrypts and decrypts credentials to/from the header format
    public static class AuthenticationHelper
    {
        // Builds a Basic auth header value from username and password
        public static string Encrypt(string username, string password)
        {
            // Concatenate credentials
            var credentials = $"{username}:{password}";
            // Convert to UTF-8 bytes
            var bytes = System.Text.Encoding.UTF8.GetBytes(credentials);
            // Encode to Base64
            var encoded = Convert.ToBase64String(bytes);
            // Prefix with "Basic "
            return $"Basic {encoded}";
        }

        // Parses a Basic auth header, outputting the username and password
        public static void Decrypt(string encryptedHeader, out string username, out string password)
        {
            // Ensure header starts with "Basic " and has content
            if (string.IsNullOrWhiteSpace(encryptedHeader)
                || !encryptedHeader.StartsWith("Basic ")
                || encryptedHeader.Length <= 6)
            {
                throw new ArgumentException("Invalid Basic authorization header.", nameof(encryptedHeader));
            }

            // Extract and decode Base64 token
            var token = encryptedHeader.Substring(6);
            var decoded = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(token));

            // Split into username and password
            var parts = decoded.Split(new[] { ':' }, 2);
            if (parts.Length != 2)
            {
                throw new ArgumentException("Invalid Basic authorization header format.", nameof(encryptedHeader));
            }

            username = parts[0];
            password = parts[1];
        }
    }
}
