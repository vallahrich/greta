// File: AuthController.cs
// Purpose: Handles user authentication (login & register), issuing Basic Auth tokens and creating new users.

using Microsoft.AspNetCore.Authorization;    // For [AllowAnonymous]
using Microsoft.AspNetCore.Mvc;               // Provides APIController and ActionResult
using PeriodTracker.Model.Entities;           // Defines User entity
using PeriodTracker.API.Middleware;           // Contains AuthenticationHelper for token operations

namespace PeriodTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]                           // Enables automatic model validation and binding
    public class AuthController : ControllerBase
    {
        private readonly UserRepository _userRepository;  // Injected repo for user CRUD

        public AuthController(UserRepository userRepository)
        {
            _userRepository = userRepository;             // Store injected dependency
        }

        // POST: api/auth/login
        // Allows anonymous access, authenticates credentials and returns Basic token in header
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

            // Generate Basic auth token
            var headerValue = AuthenticationHelper.Encrypt(
                credentials.Email,
                credentials.Password
            );

            // Send token in response header for client to use
            Response.Headers.Append("Authorization", headerValue);

            // Return user information in response body
            var response = new
            {
                userId = user.UserId,
                name   = user.Name,
                email  = user.Email
            };

            return Ok(response);
        }

        // POST: api/auth/register
        // Allows anonymous, creates a new user account
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
                Name      = request.Name,
                Email     = request.Email,
                Pw        = request.Password, // TODO: hash in production
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
                name   = user.Name,
                email  = user.Email
            });
        }
    }

    // DTO for login requests
    public class LoginRequest
    {
        public string Email    { get; set; }
        public string Password { get; set; }
    }

    // DTO for register requests
    public class RegisterRequest
    {
        public string Name     { get; set; }
        public string Email    { get; set; }
        public string Password { get; set; }
    }
}
