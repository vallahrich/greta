using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.Model.Repositories;
using System.Text;

namespace PeriodTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserRepository _userRepository;
        
        public AuthController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        
        [AllowAnonymous]
        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult Login([FromBody] LoginRequest credentials)
        {
            // Check credentials
            bool isAuthenticated = false;
            User user = null;
            
            // Check for test user first
            if (credentials.Email == "john.doe" && credentials.Password == "VerySecret!")
            {
                isAuthenticated = true;
            }
            else
            {
                // Check against database using email
                user = _userRepository.GetUserByEmail(credentials.Email);
                
                if (user != null && user.pw == credentials.Password)
                {
                    isAuthenticated = true;
                }
            }
            
            if (isAuthenticated)
            {
                // Create the auth header token
                var text = $"{credentials.Email}:{credentials.Password}";
                var bytes = Encoding.UTF8.GetBytes(text);
                var encodedCredentials = Convert.ToBase64String(bytes);
                var headerValue = $"Basic {encodedCredentials}";
                
                // Include user details in the response (excluding sensitive data like password)
                var response = new
                {
                    headerValue = headerValue,
                    userId = user?.userId,
                    name = user?.name ?? "John Doe", // Use test name if test user
                    email = credentials.Email
                };
                
                return Ok(response);
            }
            
            return Unauthorized("Invalid email or password");
        }

        [AllowAnonymous]
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult Register([FromBody] RegisterRequest request)
        {
            // Validate the request
            if (string.IsNullOrWhiteSpace(request.Name) || 
                string.IsNullOrWhiteSpace(request.Email) || 
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Name, email and password are required");
            }
            
            // Check if email already exists
            if (_userRepository.EmailExists(request.Email))
            {
                return Conflict($"Email '{request.Email}' already exists");
            }

            // Create user object
            var user = new User
            {
                name = request.Name,
                email = request.Email,
                pw = request.Password, // In a production environment, hash this password
                createdAt = DateTime.UtcNow
            };

            bool success = _userRepository.InsertUser(user);
            if (!success)
            {
                return BadRequest("Failed to create user");
            }

            // Return a success response with the created user details (excluding password)
            return CreatedAtAction(nameof(Login), new { }, new 
            { 
                userId = user.userId, 
                name = user.name, 
                email = user.email 
            });
        }
        
        // Optional: Add logout functionality if needed on the server-side
        [Authorize]
        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult Logout()
        {
            // For Basic Auth, we don't need to do anything server-side
            // The client simply needs to remove the token from storage
            
            return Ok(new { message = "Logged out successfully" });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
}