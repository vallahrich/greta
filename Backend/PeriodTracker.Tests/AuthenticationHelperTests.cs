/// <summary>
/// AuthenticationHelperTests - Unit tests for the BasicAuth helper
/// 
/// These tests verify:
/// - Encrypt correctly generates Basic auth headers from credentials
/// - Decrypt correctly extracts credentials from Basic auth headers
/// 
/// This ensures the authentication mechanism works as expected.
/// </summary>

using PeriodTracker.API.Middleware;

namespace PeriodTracker.API.Tests
{
    [TestClass]
    public class AuthenticationHelperTests
    {
        // Test that Encrypt produces the expected Basic auth header
        [TestMethod]
        public void Encrypt_ShouldReturnBasicToken()
        {
            // Arrange: Set up test credentials
            string username = "john.doe";
            string password = "VerySecret!";
            // The expected result is "Basic " followed by base64 of "username:password" 
            string expected = "Basic am9obi5kb2U6VmVyeVNlY3JldCE=";

            // Act: Call the method under test
            var actual = AuthenticationHelper.Encrypt(username, password);

            // Assert: Verify the result matches expected value
            Assert.AreEqual(expected, actual);
        }

        // Test that Decrypt extracts username and password from a header
        [TestMethod]
        public void Decrypt_ShouldReturnUsernameAndPassword()
        {
            // Arrange: Set up a valid Basic auth header to test
            var inputHeader = "Basic am9obi5kb2U6VmVyeVNlY3JldCE=";
            string expectedUsername = "john.doe";
            string expectedPassword = "VerySecret!";

            // Act: Call the decrypt method
            // Note how the out parameters let us return two values
            AuthenticationHelper.Decrypt(
                inputHeader,
                out var actualUsername,
                out var actualPassword
            );

            // Assert: Verify both values match expected
            Assert.AreEqual(expectedUsername, actualUsername);
            Assert.AreEqual(expectedPassword, actualPassword);
        }
    }
}