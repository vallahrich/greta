/// <summary>
/// PeriodCycleController - Manages user's menstrual cycle records
/// 
/// This controller handles the core functionality of the period tracking app:
/// - GET /api/periodcycle/user/{userId}: Gets all cycles for a user
/// - POST /api/periodcycle: Creates a new cycle with start/end dates
/// - DELETE /api/periodcycle/{id}/user/{userId}: Removes a cycle and its symptoms
/// 
/// Main features:
/// - User-specific cycle tracking
/// - Authentication enforcement (users only see their own data)
/// - Date validation
/// - Cascading deletion (removes associated symptoms)
/// </summary>

using Microsoft.AspNetCore.Mvc;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PeriodCycleController : ControllerBase
    {
        // Repository dependencies for data access
        private readonly PeriodCycleRepository _periodCycleRepository;
        private readonly UserRepository _userRepository;
        private readonly CycleSymptomRepository _cycleSymptomRepository;

        // Constructor using dependency injection
        public PeriodCycleController(
            PeriodCycleRepository periodCycleRepository,
            UserRepository userRepository,
            CycleSymptomRepository cycleSymptomRepository)
        {
            _periodCycleRepository = periodCycleRepository;
            _userRepository = userRepository;
            _cycleSymptomRepository = cycleSymptomRepository;
        }

        // GET: api/periodcycle/user/{userId}
        // Returns all cycles for the authenticated user
        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult<IEnumerable<PeriodCycle>> GetCyclesByUserId(int userId)
        {
            // Get the authenticated user's ID from the request context
            // This was set by the authentication middleware
            var authItem = HttpContext.Items["UserId"];
            if (authItem == null)
                return StatusCode(500, "Authentication context missing");

            // SECURITY CHECK: Users can only access their own cycles
            // This prevents unauthorized access to other users' data
            int authUserId = Convert.ToInt32(authItem);
            if (authUserId != userId)
                return Forbid("You can only access your own cycles");

            // Ensure user exists
            if (_userRepository.GetUserById(userId) is null)
                return NotFound($"User with ID {userId} not found");

            // Get all cycles for this user 
            var cycles = _periodCycleRepository.GetCyclesByUserId(userId);
            return Ok(cycles);
        }

        // POST: api/periodcycle
        // Creates a new period cycle
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<PeriodCycle> CreateCycle([FromBody] PeriodCycle cycle)
        {
            // Validate user exists
            if (_userRepository.GetUserById(cycle.UserId) is null)
                return NotFound($"User with ID {cycle.UserId} not found");

            // Validate date ordering - end date must be after start date
            if (cycle.EndDate < cycle.StartDate)
                return BadRequest("End date must be after start date");

            // Insert the new cycle into the database
            if (!_periodCycleRepository.InsertCycle(cycle))
                return BadRequest("Failed to create period cycle");

            // Return 201 Created with a link to get the user's cycles
            return CreatedAtAction(
                nameof(GetCyclesByUserId),
                new { userId = cycle.UserId },
                cycle
            );
        }

        // PUT: api/periodcycle/{id}
        // Updates an existing period cycle record with validation
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult<PeriodCycle> UpdateCycle(int id, [FromBody] PeriodCycle cycle)
        {
            // Get the authenticated user's ID from context
            var authItem = HttpContext.Items["UserId"];
            if (authItem == null)
                return StatusCode(500, "Authentication context missing");

            // Enforce that users can only update their own cycles
            int authUserId = Convert.ToInt32(authItem);
            if (authUserId != cycle.UserId)
                return Forbid("You can only update your own cycles");

            // Validate that the specified ID matches the cycle body
            if (id != cycle.CycleId)
                return BadRequest("Cycle ID in URL must match the ID in the request body");

            // Ensure cycle exists
            var existing = _periodCycleRepository.GetById(id);
            if (existing == null)
                return NotFound($"Period cycle with ID {id} not found");

            // Validate date ordering
            if (cycle.EndDate < cycle.StartDate)
                return BadRequest("End date must be after start date");

            // Add a UpdateCycle method to PeriodCycleRepository (code below)
            if (!_periodCycleRepository.UpdateCycle(cycle))
                return BadRequest("Failed to update period cycle");

            return Ok(cycle);
        }

        // DELETE: api/periodcycle/{id}/user/{userId}
        // Deletes a cycle and its symptoms, with ownership validation
        [HttpDelete("{id}/user/{userId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycle(int id, int userId)
        {
            // First check if the cycle exists
            var existing = _periodCycleRepository.GetById(id);
            if (existing is null)
                return NotFound($"Period cycle with ID {id} not found");

            // SECURITY CHECK: Ensure the cycle belongs to the specified user
            // This prevents deleting other users' cycles
            if (existing.UserId != userId)
                return StatusCode(StatusCodes.Status403Forbidden, "Cannot delete others' cycles");

            // First remove all associated cycle-symptoms
            // This is a cascading delete to maintain referential integrity
            _cycleSymptomRepository.DeleteCycleSymptomsByCycleId(id);

            // Then delete the cycle itself
            if (!_periodCycleRepository.DeleteCycle(id, userId))
                return BadRequest("Failed to delete period cycle");

            // Return 204 No Content for successful deletion (REST convention)
            return NoContent();
        }
    }
}