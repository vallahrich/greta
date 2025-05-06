/// <summary>
/// Controller that handles associations between menstrual cycles and reported symptoms.
/// Provides CRUD operations for cycle-symptom records.
/// </summary>
/// <remarks>
/// Exposes the following API endpoints:
/// - GET /api/cyclesymptom/cycle/{cycleId}: Retrieves all symptoms for a specific cycle
/// - POST /api/cyclesymptom: Creates a new symptom record for a cycle with validation
/// 
/// The controller performs validation including:
/// - Verifying cycles and symptoms exist before operations
/// - Validating intensity ranges (1-5 scale)
/// - Ensuring dates fall within cycle bounds
/// 
/// All endpoints follow standard RESTful conventions with appropriate HTTP status codes
/// and response formats.
/// </remarks>

using Microsoft.AspNetCore.Mvc;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CycleSymptomController : ControllerBase
    {
        private readonly CycleSymptomRepository _cycleSymptomRepository;
        private readonly PeriodCycleRepository _periodCycleRepository;
        private readonly SymptomRepository _symptomRepository;

        // Constructor injection of required repositories
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
        // Returns all symptom entries for a specific menstrual cycle
        [HttpGet("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<CycleSymptom>> GetCycleSymptomsByCycleId(int cycleId)
        {
            // Verify the cycle exists before querying symptoms
            var cycle = _periodCycleRepository.GetById(cycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {cycleId} not found");
            }

            var cycleSymptoms = _cycleSymptomRepository.GetSymptomsByCycleId(cycleId);
            return Ok(cycleSymptoms);
        }

        // POST: api/cyclesymptom
        // Adds a new symptom entry to a cycle, with validation
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleSymptom> CreateCycleSymptom([FromBody] CycleSymptom cycleSymptom)
        {
            // Ensure the referenced cycle exists
            var cycle = _periodCycleRepository.GetById(cycleSymptom.CycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {cycleSymptom.CycleId} not found");
            }

            // Ensure the referenced symptom exists
            var symptom = _symptomRepository.GetById(cycleSymptom.SymptomId);
            if (symptom == null)
            {
                return NotFound($"Symptom with ID {cycleSymptom.SymptomId} not found");
            }

            // Validate intensity range (1–5)
            if (cycleSymptom.Intensity < 1 || cycleSymptom.Intensity > 5)
            {
                return BadRequest("Intensity must be between 1 and 5");
            }

            // Validate date falls within cycle bounds
            if (cycleSymptom.Date < cycle.StartDate || cycleSymptom.Date > cycle.EndDate)
            {
                return BadRequest(
                    $"Symptom date must be within cycle range ({cycle.StartDate:d} to {cycle.EndDate:d})"
                );
            }

            // Attempt insertion
            var success = _cycleSymptomRepository.InsertCycleSymptom(cycleSymptom);
            if (!success)
            {
                return BadRequest("Failed to create cycle symptom");
            }

            // Return 201 Created with link to listing by cycle
            return CreatedAtAction(
                nameof(GetCycleSymptomsByCycleId),
                new { cycleId = cycleSymptom.CycleId },
                cycleSymptom
            );
        }
    }
}