// File: SymptomController.cs
// Purpose: Expose endpoints to retrieve available symptoms for users to select/report.

using Microsoft.AspNetCore.Mvc;                             // Provides controller base and HTTP attributes

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // TODO: Add [Authorize] if retrieval of symptoms should be restricted
    public class SymptomController : ControllerBase
    {
        private readonly SymptomRepository _symptomRepository;  // Data access for symptoms

        public SymptomController(SymptomRepository symptomRepository)
        {
            _symptomRepository = symptomRepository;             // Inject repository
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