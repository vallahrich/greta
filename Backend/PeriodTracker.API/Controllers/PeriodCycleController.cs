// File: PeriodCycleController.cs
// Purpose: Manage menstrual cycle records per user (list, create, delete)

using Microsoft.AspNetCore.Mvc;                             // Provides API controllers and ActionResult types

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PeriodCycleController : ControllerBase
    {
        private readonly PeriodCycleRepository _periodCycleRepository;  // CRUD for cycles
        private readonly UserRepository _userRepository;                // Validate user existence and ownership
        private readonly CycleSymptomRepository _cycleSymptomRepository; // Cascade-delete related symptoms

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
        // Returns all cycles belonging to the authenticated user
        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult<IEnumerable<PeriodCycle>> GetCyclesByUserId(int userId)
        {
            // Get the authenticated user's ID from context
            var authItem = HttpContext.Items["UserId"];
            if (authItem == null)
                return StatusCode(500, "Authentication context missing");

            // Enforce that users can only access their own cycles
            int authUserId = Convert.ToInt32(authItem);
            if (authUserId != userId)
                return Forbid("You can only access your own cycles");

            // Ensure user exists
            if (_userRepository.GetUserById(userId) is null)
                return NotFound($"User with ID {userId} not found");

            // Fetch and return the cycles
            var cycles = _periodCycleRepository.GetCyclesByUserId(userId);
            return Ok(cycles);
        }

        // POST: api/periodcycle
        // Creates a new period cycle record for a user
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<PeriodCycle> CreateCycle([FromBody] PeriodCycle cycle)
        {
            // Validate related user
            if (_userRepository.GetUserById(cycle.UserId) is null)
                return NotFound($"User with ID {cycle.UserId} not found");

            // Validate date ordering
            if (cycle.EndDate < cycle.StartDate)
                return BadRequest("End date must be after start date");

            // Insert new cycle
            if (!_periodCycleRepository.InsertCycle(cycle))
                return BadRequest("Failed to create period cycle");

            // Return 201 Created with link to user's cycles
            return CreatedAtAction(
                nameof(GetCyclesByUserId),
                new { userId = cycle.UserId },
                cycle
            );
        }

        // DELETE: api/periodcycle/{id}/user/{userId}
        // Deletes a cycle and its associated symptoms, only if owned by user
        [HttpDelete("{id}/user/{userId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycle(int id, int userId)
        {
            // Ensure cycle exists
            var existing = _periodCycleRepository.GetById(id);
            if (existing is null)
                return NotFound($"Period cycle with ID {id} not found");

            // Enforce ownership
            if (existing.UserId != userId)
                return StatusCode(StatusCodes.Status403Forbidden, "Cannot delete others' cycles");

            // Remove related cycle-symptoms first
            _cycleSymptomRepository.DeleteCycleSymptomsByCycleId(id);

            // Delete cycle
            if (!_periodCycleRepository.DeleteCycle(id, userId))
                return BadRequest("Failed to delete period cycle");

            return NoContent(); // HTTP 204
        }
    }

}