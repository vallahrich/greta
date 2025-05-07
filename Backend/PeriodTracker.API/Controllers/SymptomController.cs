/// <summary>
/// SymptomController - Provides access to the catalog of available symptoms
/// 
/// Simple controller with a single endpoint:
/// - GET /api/symptom: Returns the complete list of symptom definitions
/// 
/// This is a read-only lookup table controller that provides reference data 
/// for the app's symptom tracking features. It doesn't require authentication
/// since the symptom list is not user-specific.
/// </summary>

using Microsoft.AspNetCore.Mvc;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SymptomController : ControllerBase
    {
        // Repository for accessing symptom definitions
        private readonly SymptomRepository _symptomRepository;

        // Constructor with dependency injection
        public SymptomController(SymptomRepository symptomRepository)
        {
            _symptomRepository = symptomRepository;
        }

        // GET: api/symptom
        // Returns the complete list of symptoms users can track
        // (e.g., cramps, headache, mood swings, etc.)
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<Symptom>> GetAllSymptoms()
        {
            // Simple passthrough to the repository - no complex logic needed here
            var symptoms = _symptomRepository.GetAllSymptoms();
            return Ok(symptoms);
        }
    }
}