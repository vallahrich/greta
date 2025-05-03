using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.Model.Repositories;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CycleSymptomController : ControllerBase
    {
        private readonly CycleSymptomRepository _cycleSymptomRepository;
        private readonly PeriodCycleRepository _periodCycleRepository;
        private readonly SymptomRepository _symptomRepository;

        public CycleSymptomController(
            CycleSymptomRepository cycleSymptomRepository,
            PeriodCycleRepository periodCycleRepository,
            SymptomRepository symptomRepository)
        {
            _cycleSymptomRepository = cycleSymptomRepository;
            _periodCycleRepository = periodCycleRepository;
            _symptomRepository = symptomRepository;
        }

        // GET: api/cyclesymptom/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleSymptom> GetCycleSymptomById(int id)
        {
            try
            {
                var cycleSymptom = _cycleSymptomRepository.GetById(id);
                if (cycleSymptom == null)
                {
                    return NotFound($"Cycle symptom with ID {id} not found");
                }
                
                return Ok(cycleSymptom);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving cycle symptom");
            }
        }

        // GET: api/cyclesymptom/cycle/{cycleId}
        [HttpGet("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<CycleSymptom>> GetCycleSymptomsByCycleId(int cycleId)
        {
            try
            {
                // Check if cycle exists
                var cycle = _periodCycleRepository.GetById(cycleId);
                if (cycle == null)
                {
                    return NotFound($"Period cycle with ID {cycleId} not found");
                }
                
                var cycleSymptoms = _cycleSymptomRepository.GetSymptomsByCycleId(cycleId);
                return Ok(cycleSymptoms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving cycle symptoms");
            }
        }

        // POST: api/cyclesymptom
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleSymptom> CreateCycleSymptom(CycleSymptom cycleSymptom)
        {
            try
            {
                // Check if cycle exists
                var cycle = _periodCycleRepository.GetById(cycleSymptom.CycleId);
                if (cycle == null)
                {
                    return NotFound($"Period cycle with ID {cycleSymptom.CycleId} not found");
                }
                
                // Check if symptom exists
                var symptom = _symptomRepository.GetById(cycleSymptom.SymptomId);
                if (symptom == null)
                {
                    return NotFound($"Symptom with ID {cycleSymptom.SymptomId} not found");
                }

                // Validate intensity
                if (cycleSymptom.Intensity < 1 || cycleSymptom.Intensity > 5)
                {
                    return BadRequest("Intensity must be between 1 and 5");
                }

                // Validate that the symptom date is within the cycle date range
                if (cycleSymptom.Date < cycle.StartDate || cycleSymptom.Date > cycle.EndDate)
                {
                    return BadRequest($"Symptom date must be within the cycle date range ({cycle.StartDate.ToShortDateString()} to {cycle.EndDate.ToShortDateString()})");
                }

                bool success = _cycleSymptomRepository.InsertCycleSymptom(cycleSymptom);
                if (!success)
                {
                    return BadRequest("Failed to create cycle symptom");
                }

                return CreatedAtAction(nameof(GetCycleSymptomById), new { id = cycleSymptom.CycleSymptomId }, cycleSymptom);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while creating cycle symptom");
            }
        }

        // PUT: api/cyclesymptom
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdateCycleSymptom(CycleSymptom cycleSymptom)
        {
            try
            {
                // Check if cycle symptom exists
                var existingCycleSymptom = _cycleSymptomRepository.GetById(cycleSymptom.CycleSymptomId);
                if (existingCycleSymptom == null)
                {
                    return NotFound($"Cycle symptom with ID {cycleSymptom.CycleSymptomId} not found");
                }
                
                // Get cycle for date validation
                var cycle = _periodCycleRepository.GetById(existingCycleSymptom.CycleId);
                
                // Validate intensity
                if (cycleSymptom.Intensity < 1 || cycleSymptom.Intensity > 5)
                {
                    return BadRequest("Intensity must be between 1 and 5");
                }

                // Validate that the symptom date is within the cycle date range
                if (cycleSymptom.Date < cycle.StartDate || cycleSymptom.Date > cycle.EndDate)
                {
                    return BadRequest($"Symptom date must be within the cycle date range ({cycle.StartDate.ToShortDateString()} to {cycle.EndDate.ToShortDateString()})");
                }

                // Only allow updating intensity and date
                existingCycleSymptom.Intensity = cycleSymptom.Intensity;
                existingCycleSymptom.Date = cycleSymptom.Date;

                bool success = _cycleSymptomRepository.UpdateCycleSymptom(existingCycleSymptom);
                if (!success)
                {
                    return BadRequest("Failed to update cycle symptom");
                }

                return Ok(existingCycleSymptom);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while updating cycle symptom");
            }
        }

        // DELETE: api/cyclesymptom/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycleSymptom(int id)
        {
            try
            {
                // Check if cycle symptom exists
                var existingCycleSymptom = _cycleSymptomRepository.GetById(id);
                if (existingCycleSymptom == null)
                {
                    return NotFound($"Cycle symptom with ID {id} not found");
                }

                bool success = _cycleSymptomRepository.DeleteCycleSymptom(id);
                if (!success)
                {
                    return BadRequest("Failed to delete cycle symptom");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while deleting cycle symptom");
            }
        }

        // DELETE: api/cyclesymptom/cycle/{cycleId}
        [HttpDelete("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycleSymptomsByCycleId(int cycleId)
        {
            try
            {
                // Check if cycle exists
                var cycle = _periodCycleRepository.GetById(cycleId);
                if (cycle == null)
                {
                    return NotFound($"Period cycle with ID {cycleId} not found");
                }

                bool success = _cycleSymptomRepository.DeleteCycleSymptomsByCycleId(cycleId);
                if (!success)
                {
                    return BadRequest("Failed to delete cycle symptoms");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while deleting cycle symptoms");
            }
        }
    }
}