/// <summary>
/// CycleSymptomController - Manages associations between period cycles and symptoms
/// 
/// This controller handles the tracking of symptoms during menstrual cycles through:
/// - GET /api/cyclesymptom/cycle/{cycleId}: Gets all symptoms for a specific cycle
/// - POST /api/cyclesymptom: Records a new symptom for a cycle with validation
/// 
/// Main features:
/// - Tracking symptom intensity (1-5 scale)
/// - Data validation (existence checks, range validation)
/// - Date constraints (symptoms must fall within cycle dates)
/// - Relationship management between cycles and symptoms
/// </summary>

using Microsoft.AspNetCore.Mvc;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CycleSymptomController : ControllerBase
    {
        // Repositories for accessing cycle-symptom data, cycles, and symptom definitions
        // Using dependency injection to keep the controller testable
        private readonly CycleSymptomRepository _cycleSymptomRepository;
        private readonly PeriodCycleRepository _periodCycleRepository;
        private readonly SymptomRepository _symptomRepository;

        // Constructor injection of the repositories we need
        public CycleSymptomController(
            CycleSymptomRepository cycleSymptomRepository,
            PeriodCycleRepository periodCycleRepository,
            SymptomRepository symptomRepository)
        {
            _cycleSymptomRepository = cycleSymptomRepository;
            _periodCycleRepository = periodCycleRepository;
            _symptomRepository = symptomRepository;
        }

        // GET: api/cyclesymptom/cycle/{cycleId}
        // Returns all symptoms recorded for a specific menstrual cycle
        [HttpGet("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<CycleSymptom>> GetCycleSymptomsByCycleId(int cycleId)
        {
            // First verify the cycle exists - this is a foreign key constraint
            // but we want to provide a clear error message
            var cycle = _periodCycleRepository.GetById(cycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {cycleId} not found");
            }

            // Fetch all symptoms for this cycle
            var cycleSymptoms = _cycleSymptomRepository.GetSymptomsByCycleId(cycleId);
            return Ok(cycleSymptoms);
        }

        // DELETE: api/cyclesymptom/{id}
        // Deletes a specific cycle symptom by ID
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycleSymptom(int id)
        {
            // Check if the symptom exists
            var symptom = _cycleSymptomRepository.GetById(id);
            if (symptom == null)
            {
                return NotFound($"Cycle symptom with ID {id} not found");
            }

            // Delete the symptom
            var success = _cycleSymptomRepository.DeleteCycleSymptom(id);
            if (!success)
            {
                return BadRequest("Failed to delete cycle symptom");
            }

            // Return 204 No Content for successful deletion (REST convention)
            return NoContent();
        }

        // PUT: api/cyclesymptom/{id}
        // Updates a specific cycle symptom
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<CycleSymptom> UpdateCycleSymptom(int id, [FromBody] CycleSymptom cycleSymptom)
        {
            // Validate the ID in the route matches the body
            if (id != cycleSymptom.CycleSymptomId)
            {
                return BadRequest("ID in URL must match ID in request body");
            }

            // Validate the intensity range (must be 1-5 scale)
            if (cycleSymptom.Intensity < 1 || cycleSymptom.Intensity > 5)
            {
                return BadRequest("Intensity must be between 1 and 5");
            }

            // Check if the cycle exists
            var cycle = _periodCycleRepository.GetById(cycleSymptom.CycleId);
            if (cycle == null)
            {
                return BadRequest($"Period cycle with ID {cycleSymptom.CycleId} not found");
            }

            // Ensure the symptom date falls within the cycle's timeframe
            if (cycleSymptom.Date < cycle.StartDate || cycleSymptom.Date > cycle.EndDate)
            {
                return BadRequest(
                    $"Symptom date must be within cycle range ({cycle.StartDate:d} to {cycle.EndDate:d})"
                );
            }

            // Update the symptom
            var success = _cycleSymptomRepository.UpdateCycleSymptom(cycleSymptom);
            if (!success)
            {
                return BadRequest("Failed to update cycle symptom");
            }

            return Ok(cycleSymptom);
        }

        // POST: api/cyclesymptom
        // Creates a new symptom entry for a cycle with validation
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleSymptom> CreateCycleSymptom([FromBody] CycleSymptom cycleSymptom)
        {
            // Step 1: Verify the referenced cycle exists
            var cycle = _periodCycleRepository.GetById(cycleSymptom.CycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {cycleSymptom.CycleId} not found");
            }

            // Step 2: Verify the referenced symptom exists
            var symptom = _symptomRepository.GetById(cycleSymptom.SymptomId);
            if (symptom == null)
            {
                return NotFound($"Symptom with ID {cycleSymptom.SymptomId} not found");
            }

            // Step 3: Validate the intensity range (must be 1-5 scale)
            if (cycleSymptom.Intensity < 1 || cycleSymptom.Intensity > 5)
            {
                return BadRequest("Intensity must be between 1 and 5");
            }

            // Step 4: Ensure the symptom date falls within the cycle's timeframe
            if (cycleSymptom.Date < cycle.StartDate || cycleSymptom.Date > cycle.EndDate)
            {
                return BadRequest(
                    $"Symptom date must be within cycle range ({cycle.StartDate:d} to {cycle.EndDate:d})"
                );
            }

            // Step 5: Save the new symptom record
            var success = _cycleSymptomRepository.InsertCycleSymptom(cycleSymptom);
            if (!success)
            {
                return BadRequest("Failed to create cycle symptom");
            }

            // Return 201 Created status with a link to retrieve the symptoms by cycle
            // This follows REST conventions for resource creation
            return CreatedAtAction(
                nameof(GetCycleSymptomsByCycleId),
                new { cycleId = cycleSymptom.CycleId },
                cycleSymptom
            );
        }
    }
}