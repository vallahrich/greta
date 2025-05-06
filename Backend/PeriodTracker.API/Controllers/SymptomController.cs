/// <summary>
/// Controller that exposes endpoints to retrieve available symptoms for users to select or report.
/// </summary>
/// <remarks>
/// Exposes the following API endpoint:
/// - GET /api/symptom: Returns a complete list of defined symptoms (e.g., cramps, headache)
/// 
/// The controller provides the catalog of symptom definitions that users can select from
/// when recording symptoms associated with their menstrual cycles.
/// 
/// This endpoint is designed to be accessible without authentication, providing public
/// access to reference data used throughout the application.
/// </remarks>

using Microsoft.AspNetCore.Mvc;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SymptomController : ControllerBase
    {
        private readonly SymptomRepository _symptomRepository;

        public SymptomController(SymptomRepository symptomRepository)
        {
            _symptomRepository = symptomRepository;
        }

        // GET: api/symptom
        // Returns list of all defined symptoms (e.g. cramps, headache)
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<Symptom>> GetAllSymptoms()
        {
            // Fetch all symptom records from repository
            var symptoms = _symptomRepository.GetAllSymptoms();
            return Ok(symptoms);
        }
    }
}