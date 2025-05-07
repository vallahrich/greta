/// <summary>
/// UserController - Manages user profile information and account settings
/// 
/// This controller handles user data management through:
/// - GET /api/user/byemail/{email}: Retrieves user profile
/// - PUT /api/user: Updates user profile (name, email)
/// - PUT /api/user/password: Changes user password
/// - DELETE /api/user/{id}: Deletes user account
/// 
/// Main features:
/// - User profile management
/// - Authentication and authorization checks
/// - Password changes
/// - Account deletion
/// </summary>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        // Repository for user data access
        private readonly UserRepository _userRepository;

        // Constructor with dependency injection
        public UserController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // GET: api/user/byemail/{email}
        // Retrieves a user profile by email (authenticated users only)
        [HttpGet("byemail/{email}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<User>> GetUserByEmail(string email)
        {
            // Get the authenticated user's email from the request context
            // (Set by the authentication middleware)
            var authEmail = HttpContext.Items["UserEmail"].ToString();
            
            // SECURITY CHECK: Users can only view their own profile
            if (authEmail != email)
                return Forbid("You can only access your own information");

            // Try to find the user
            var user = _userRepository.GetUserByEmail(email);
            if (user == null)
                return NotFound($"User with email '{email}' not found");

            return Ok(user);
        }

        // PUT: api/user
        // Updates a user's profile information
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult UpdateUser([FromBody] User updatedUser)
        {
            // First check if the user exists
            var existing = _userRepository.GetUserById(updatedUser.UserId);
            if (existing == null)
                return NotFound($"User with ID {updatedUser.UserId} not found");

            // If email is being changed, check for conflicts
            if (!string.Equals(existing.Email, updatedUser.Email, StringComparison.OrdinalIgnoreCase))
            {
                var conflict = _userRepository.GetUserByEmail(updatedUser.Email);
                if (conflict != null && conflict.UserId != updatedUser.UserId)
                    return Conflict($"Email '{updatedUser.Email}' is already taken");
            }

            // Update the user profile
            if (!_userRepository.UpdateUser(updatedUser))
                return BadRequest("Failed to update user");

            return Ok(updatedUser);
        }

        // PUT: api/user/password
        // Changes a user's password
        [HttpPut("password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdatePassword([FromBody] PasswordUpdateRequest request)
        {
            // Verify user exists
            var existing = _userRepository.GetUserById(request.UserId);
            if (existing == null)
                return NotFound($"User with ID {request.UserId} not found");

            // Update the password
            // Note: In production, we should hash the password before storing
            if (!_userRepository.UpdateUserPassword(request.UserId, request.Password))
                return BadRequest("Failed to update password");

            // Return success message
            return Ok(new { message = "Password updated successfully" });
        }

        // DELETE: api/user/{id}
        // Deletes a user account
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult DeleteUser(int id)
        {
            // Get authenticated user ID from context
            var authId = HttpContext.Items["UserId"] as int?;
            
            // SECURITY CHECK: Users can only delete their own account
            if (authId != id)
                return Forbid("You can only delete your own account");

            // Verify user exists
            if (_userRepository.GetUserById(id) == null)
                return NotFound($"User with ID {id} not found");

            // Delete the user
            if (!_userRepository.DeleteUser(id))
                return BadRequest("Failed to delete user");

            // Return 204 No Content for successful deletion (REST convention)
            return NoContent();
        }
    }

    // DTO for password update requests
    public class PasswordUpdateRequest
    {
        public int UserId { get; set; }
        public string Password { get; set; }
    }
}