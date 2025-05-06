using PeriodTracker.API.Middleware;                   // Target class for testing

namespace PeriodTracker.API.Tests
{
    // Tests for the basic auth helper methods
    [TestClass]
    public class AuthenticationHelperTests
    {
        // Verifies that Encrypt produces the expected Basic auth header
        [TestMethod]
        public void Encrypt_ShouldReturnBasicToken()
        {
            // Arrange: known credentials
            string username = "john.doe";
            string password = "VerySecret!";

            // Act: generate header
            var header = AuthenticationHelper.Encrypt(username, password);

            // Assert: header matches expected Base64 encoding
            Assert.AreEqual("Basic am9obi5kb2U6VmVyeVNlY3JldCE=", header);
        }

        // Verifies that Decrypt correctly parses the header back into credentials
        [TestMethod]
        public void Decrypt_ShouldReturnUsernameAndPassword()
        {
            // Arrange: a valid Basic auth header value
            var inputHeader = "Basic am9obi5kb2U6VmVyeVNlY3JldCE=";

            // Act: decrypt header
            AuthenticationHelper.Decrypt(
                inputHeader,
                out var user,
                out var pass
            );

            // Assert: original username and password are recovered
            Assert.AreEqual("john.doe", user);
            Assert.AreEqual("VerySecret!", pass);
        }
    }
}