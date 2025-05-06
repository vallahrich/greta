/// <summary>
/// Controller that handles user authentication operations through a RESTful API interface.
/// Provides endpoints for user login and registration.
/// </summary>
/// <remarks>
/// Exposes the following API endpoints:
/// - POST /api/auth/login: Authenticates a user by email and password, returning a token
/// - POST /api/auth/register: Creates a new user account with validation
/// 
/// The controller performs validation including:
/// - Ensuring required fields are provided
/// - Preventing duplicate email registrations
/// - Verifying credentials against the database
/// 
/// All endpoints follow standard RESTful conventions with appropriate HTTP status codes
/// and response formats.
/// </remarks>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.API.Middleware;

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

        // POST: api/auth/login
        [AllowAnonymous]
        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult Login([FromBody] LoginRequest credentials)
        {
            // Validate input presence
            if (string.IsNullOrWhiteSpace(credentials.Email) || string.IsNullOrWhiteSpace(credentials.Password))
                return BadRequest("Email and password are required");

            // Fetch user from database and verify password
            var user = _userRepository.GetUserByEmail(credentials.Email);
            if (user == null || user.Pw != credentials.Password)
                return Unauthorized("Invalid email or password");

            // Generate token
            var token = AuthenticationHelper.Encrypt(credentials.Email, credentials.Password);

            // Return user data and token in response body
            var response = new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                token = token  // Include token in response body
            };

            return Ok(response);
        }

        // POST: api/auth/register
        [AllowAnonymous]
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult Register([FromBody] RegisterRequest request)
        {
            // Ensure required fields are provided
            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Name, email and password are required");

            // Prevent duplicate emails
            if (_userRepository.EmailExists(request.Email))
                return Conflict($"Email '{request.Email}' already exists");

            // Map DTO to User entity
            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                Pw = request.Password, // TODO: hash in production
                CreatedAt = DateTime.UtcNow
            };

            // Insert into database
            var success = _userRepository.InsertUser(user);
            if (!success)
                return BadRequest("Failed to create user");

            // Return 201 Created with user details
            return CreatedAtAction(nameof(Login), new { }, new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email
            });
        }
    }

    // DTO for login requests
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    // DTO for register requests
    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
}