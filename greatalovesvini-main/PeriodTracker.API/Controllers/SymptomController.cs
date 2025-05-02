using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.Model.Repositories;

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
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<Symptom>> GetAllSymptoms()
        {
            var symptoms = _symptomRepository.GetAllSymptoms();
            return Ok(symptoms);
        }

        // GET: api/symptom/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<Symptom> GetSymptomById(int id)
        {
            var symptom = _symptomRepository.GetById(id);
            if (symptom == null)
            {
                return NotFound($"Symptom with ID {id} not found");
            }
            
            return Ok(symptom);
        }

        // POST: api/symptom
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<Symptom> CreateSymptom(Symptom symptom)
        {
            if (string.IsNullOrWhiteSpace(symptom.name))
            {
                return BadRequest("Symptom name is required");
            }

            bool success = _symptomRepository.InsertSymptom(symptom);
            if (!success)
            {
                return BadRequest("Failed to create symptom");
            }

            return CreatedAtAction(nameof(GetSymptomById), new { id = symptom.symptomId }, symptom);
        }

        // PUT: api/symptom
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdateSymptom(Symptom symptom)
        {
            // Check if symptom exists
            var existingSymptom = _symptomRepository.GetById(symptom.symptomId);
            if (existingSymptom == null)
            {
                return NotFound($"Symptom with ID {symptom.symptomId} not found");
            }

            if (string.IsNullOrWhiteSpace(symptom.name))
            {
                return BadRequest("Symptom name is required");
            }

            bool success = _symptomRepository.UpdateSymptom(symptom);
            if (!success)
            {
                return BadRequest("Failed to update symptom");
            }

            return Ok(symptom);
        }

        // DELETE: api/symptom/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteSymptom(int id)
        {
            // Check if symptom exists
            var existingSymptom = _symptomRepository.GetById(id);
            if (existingSymptom == null)
            {
                return NotFound($"Symptom with ID {id} not found");
            }

            bool success = _symptomRepository.DeleteSymptom(id);
            if (!success)
            {
                return BadRequest("Failed to delete symptom");
            }

            return NoContent();
        }
    }
}