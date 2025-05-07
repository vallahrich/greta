/// <summary>
/// AuthController - Manages user authentication for the Period Tracker API
/// 
/// This controller handles user login and registration through the API endpoints:
/// - POST /api/auth/login: Authenticates users and returns a token
/// - POST /api/auth/register: Creates new user accounts with validation
/// 
/// Main features:
/// - Basic authentication using email/password
/// - Token generation for authenticated sessions
/// - Input validation (required fields, duplicate prevention)
/// - RESTful response patterns (appropriate status codes)
/// </summary>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.API.Middleware;

namespace PeriodTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController] // This attribute enables automatic model validation
    public class AuthController : ControllerBase
    {
        // Dependency injection - we're using the repository pattern 
        // to separate data access from our controller logic
        private readonly UserRepository _userRepository;

        // Constructor receiving the user repository via DI
        public AuthController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // POST: api/auth/login
        // This endpoint authenticates a user and returns a token
        [AllowAnonymous] // Anyone can access this endpoint (no auth required)
        [HttpPost("login")]
        // Response status code documentation for Swagger/OpenAPI
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult Login([FromBody] LoginRequest credentials)
        {
            // Validate that both email and password were provided
            if (string.IsNullOrWhiteSpace(credentials.Email) || string.IsNullOrWhiteSpace(credentials.Password))
                return BadRequest("Email and password are required");

            // Try to find the user in the database
            var user = _userRepository.GetUserByEmail(credentials.Email);
            
            // If user doesn't exist or password doesn't match, return a generic error
            // (Never reveal which was incorrect for security reasons)
            if (user == null || user.Pw != credentials.Password)
                return Unauthorized("Invalid email or password");

            // Generate an authentication token (this is just Basic auth for simplicity)
            // In a production app, this should probably be JWT instead
            var token = AuthenticationHelper.Encrypt(credentials.Email, credentials.Password);

            // Return user data and token in a clean response object
            var response = new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                token = token
            };

            return Ok(response);
        }

        // POST: api/auth/register
        // This endpoint creates a new user account
        [AllowAnonymous] // Anyone can access this endpoint
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult Register([FromBody] RegisterRequest request)
        {
            // Ensure all required fields are provided
            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Name, email and password are required");

            // Check if the email is already registered
            if (_userRepository.EmailExists(request.Email))
                return Conflict($"Email '{request.Email}' already exists");

            // Create a new User entity from the request DTO
            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                Pw = request.Password, // NOTE: We should hash passwords before storing!
                CreatedAt = DateTime.UtcNow // Always use UTC for database timestamps
            };

            // Attempt to insert the user into the database
            var success = _userRepository.InsertUser(user);
            if (!success)
                return BadRequest("Failed to create user");

            // Return 201 Created with the new user details
            // (201 is the correct response for successful resource creation)
            return CreatedAtAction(nameof(Login), new { }, new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email
            });
        }
    }

    // Data Transfer Objects for request payloads
    // Using separate DTOs prevents exposing our entity models directly to clients
    
    // Used for login requests
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    // Used for registration requests
    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
}