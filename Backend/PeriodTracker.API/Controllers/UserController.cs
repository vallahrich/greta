// File: UserController.cs
// Purpose: CRUD operations for user profiles (retrieve by email, update, change password, delete)

using Microsoft.AspNetCore.Authorization;  // For securing endpoints
using Microsoft.AspNetCore.Mvc;            // Provides ControllerBase, routing, and ActionResult
using PeriodTracker.Model.Entities;        // Defines User entity

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]  // Require authentication for all actions by default
    public class UserController : ControllerBase
    {
        private readonly UserRepository _userRepository;  // Handles DB operations for users

        public UserController(UserRepository userRepository)
        {
            _userRepository = userRepository;             // Inject UserRepository
        }

        // GET: api/user/byemail/{email}
        // Retrieves the authenticated user's profile by email
        [HttpGet("byemail/{email}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<User> GetUserByEmail(string email)
        {
            // Ensure the user is requesting their own data
            var authEmail = HttpContext.Items["UserEmail"]?.ToString();
            if (authEmail != email)
                return Forbid("You can only access your own information");

            // Fetch user from database
            var user = _userRepository.GetUserByEmail(email);
            if (user == null)
                return NotFound($"User with email '{email}' not found");

            return Ok(user);
        }

        // PUT: api/user
        // Updates user profile (name, email) for the authenticated user
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult UpdateUser([FromBody] User updatedUser)
        {
            // Verify user exists
            var existing = _userRepository.GetUserById(updatedUser.UserId);
            if (existing == null)
                return NotFound($"User with ID {updatedUser.UserId} not found");

            // If email is changed, ensure it's unique
            if (!string.Equals(existing.Email, updatedUser.Email, StringComparison.OrdinalIgnoreCase))
            {
                var conflict = _userRepository.GetUserByEmail(updatedUser.Email);
                if (conflict != null && conflict.UserId != updatedUser.UserId)
                    return Conflict($"Email '{updatedUser.Email}' is already taken");
            }

            // Perform update
            if (!_userRepository.UpdateUser(updatedUser))
                return BadRequest("Failed to update user");

            return Ok(updatedUser);
        }

        // PUT: api/user/password
        // Changes password for the authenticated user
        [HttpPut("password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdatePassword([FromBody] PasswordUpdateRequest request)
        {
            // Ensure user exists
            var existing = _userRepository.GetUserById(request.UserId);
            if (existing == null)
                return NotFound($"User with ID {request.UserId} not found");

            // Update password
            if (!_userRepository.UpdateUserPassword(request.UserId, request.Password))
                return BadRequest("Failed to update password");

            return Ok("Password updated successfully");
        }

        // DELETE: api/user/{id}
        // Deletes the authenticated user's account
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult DeleteUser(int id)
        {
            // Ensure user is deleting own account
            var authId = HttpContext.Items["UserId"] as int?;
            if (authId != id)
                return Forbid("You can only delete your own account");

            // Verify existence
            if (_userRepository.GetUserById(id) == null)
                return NotFound($"User with ID {id} not found");

            // Perform deletion
            if (!_userRepository.DeleteUser(id))
                return BadRequest("Failed to delete user");

            return NoContent();
        }
    }

    // DTO for password update
    public class PasswordUpdateRequest
    {
        public int UserId   { get; set; }
        public string Password { get; set; }
    }
}
