namespace PeriodTracker.API.Middleware
{
    public static class AuthenticationHelper
    {
        public static string Encrypt(string username, string password)
        {
            // Concatenate credentials with a ':'
            string credentials = $"{username}:{password}";
            
            // Convert to bytes
            byte[] bytes = System.Text.Encoding.UTF8.GetBytes(credentials);
            
            // Base64 encode
            string encryptedCredentials = Convert.ToBase64String(bytes);
            
            // Return with 'Basic' prefix
            return $"Basic {encryptedCredentials}";
        }
        
        public static void Decrypt(string encryptedHeader, out string username, out string password)
        {
            // Extract the Base64 part
            var auth = encryptedHeader.Split(' ')[1];
            
            // Decode from Base64
            var usernameAndPassword = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(auth));
            
            // Split username and password
            var parts = usernameAndPassword.Split(':');
            username = parts[0];
            password = parts[1];
        }
    }
}