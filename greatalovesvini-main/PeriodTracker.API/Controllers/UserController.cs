using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.Model.Repositories;
using Microsoft.AspNetCore.Authorization;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserRepository _userRepository;

        public UserController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // GET: api/user
        [HttpGet]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<User>> GetUsers()
        {
            try
            {
                var users = _userRepository.GetUsers();
                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in GetUsers: {ex.Message}");
                return StatusCode(500, "An error occurred while retrieving users");
            }
        }

        // GET: api/user/{id}
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<User> GetUserById(int id)
        {
            try
            {
                var user = _userRepository.GetUserById(id);
                if (user == null)
                {
                    return NotFound($"User with ID {id} not found");
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in GetUserById: {ex.Message}");
                return StatusCode(500, "An error occurred while retrieving user");
            }
        }

        // GET: api/user/byemail/{email}
        [HttpGet("byemail/{email}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<User> GetUserByEmail(string email)
        {
            try
            {
                var user = _userRepository.GetUserByEmail(email);
                if (user == null)
                {
                    return NotFound($"User with email '{email}' not found");
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] ERROR in GetUserByEmail: {ex.Message}");
                return StatusCode(500, "An error occurred while retrieving user by email");
            }
        }

        // POST: api/user
        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult<User> CreateUser(User user)
        {
            try
            {
                if (_userRepository.EmailExists(user.Email))
                {
                    return Conflict($"Email '{user.Email}' already exists");
                }

                bool success = _userRepository.InsertUser(user);
                if (!success)
                {
                    return BadRequest("Failed to create user");
                }

                return CreatedAtAction(nameof(GetUserById), new { id = user.UserId }, user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in CreateUser: {ex.Message}");
                return StatusCode(500, "An error occurred while creating user");
            }
        }

        // PUT: api/user
        [HttpPut]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public ActionResult UpdateUser(User user)
        {
            try
            {
                var existingUser = _userRepository.GetUserById(user.UserId);
                if (existingUser == null)
                {
                    return NotFound($"User with ID {user.UserId} not found");
                }

                if (user.Email != existingUser.Email)
                {
                    var userWithSameEmail = _userRepository.GetUserByEmail(user.Email);
                    if (userWithSameEmail != null && userWithSameEmail.UserId != user.UserId)
                    {
                        return Conflict($"Email '{user.Email}' is already taken");
                    }
                }

                bool success = _userRepository.UpdateUser(user);
                if (!success)
                {
                    return BadRequest("Failed to update user");
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in UpdateUser: {ex.Message}");
                return StatusCode(500, "An error occurred while updating user");
            }
        }

        // PUT: api/user/password
        [HttpPut("password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdatePassword([FromBody] PasswordUpdateRequest request)
        {
            try
            {
                var existingUser = _userRepository.GetUserById(request.UserId);
                if (existingUser == null)
                {
                    return NotFound($"User with ID {request.UserId} not found");
                }

                bool success = _userRepository.UpdateUserPassword(request.UserId, request.Password);
                if (!success)
                {
                    return BadRequest("Failed to update password");
                }

                return Ok("Password updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in UpdatePassword: {ex.Message}");
                return StatusCode(500, "An error occurred while updating password");
            }
        }

        // DELETE: api/user/{id}
        [HttpDelete("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult DeleteUser(int id)
        {
            try
            {
                var existingUser = _userRepository.GetUserById(id);
                if (existingUser == null)
                {
                    return NotFound($"User with ID {id} not found");
                }

                bool success = _userRepository.DeleteUser(id);
                if (!success)
                {
                    return BadRequest("Failed to delete user");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in DeleteUser: {ex.Message}");
                return StatusCode(500, "An error occurred while deleting user");
            }
        }

        // GET: api/user/exists/email/{email}
        [HttpGet("exists/email/{email}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<bool> EmailExists(string email)
        {
            try
            {
                var exists = _userRepository.EmailExists(email);
                return Ok(exists);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserController] Error in EmailExists: {ex.Message}");
                return StatusCode(500, "An error occurred while checking if email exists");
            }
        }
    }

    public class PasswordUpdateRequest
    {
        public int UserId { get; set; }
        public string Password { get; set; }
    }
}