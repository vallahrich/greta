using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
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
            var cycleSymptom = _cycleSymptomRepository.GetById(id);
            if (cycleSymptom == null)
            {
                return NotFound($"Cycle symptom with ID {id} not found");
            }
            
            return Ok(cycleSymptom);
        }

        // GET: api/cyclesymptom/cycle/{cycleId}
        [HttpGet("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<CycleSymptom>> GetCycleSymptomsByCycleId(int cycleId)
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

        // GET: api/cyclesymptom/date/{date}
        [HttpGet("date/{date}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<CycleSymptom>> GetCycleSymptomsByDate(DateTime date)
        {
            var cycleSymptoms = _cycleSymptomRepository.GetSymptomsByDate(date);
            return Ok(cycleSymptoms);
        }

        // POST: api/cyclesymptom
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleSymptom> CreateCycleSymptom(CycleSymptom cycleSymptom)
        {
            // Check if cycle exists
            var cycle = _periodCycleRepository.GetById(cycleSymptom.cycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {cycleSymptom.cycleId} not found");
            }
            
            // Check if symptom exists
            var symptom = _symptomRepository.GetById(cycleSymptom.symptomId);
            if (symptom == null)
            {
                return NotFound($"Symptom with ID {cycleSymptom.symptomId} not found");
            }

            // Validate intensity
            if (cycleSymptom.intensity < 1 || cycleSymptom.intensity > 5)
            {
                return BadRequest("Intensity must be between 1 and 5");
            }

            // Validate that the symptom date is within the cycle date range
            if (cycleSymptom.date < cycle.startDate || cycleSymptom.date > cycle.endDate)
            {
                return BadRequest($"Symptom date must be within the cycle date range ({cycle.startDate.ToShortDateString()} to {cycle.endDate.ToShortDateString()})");
            }

            bool success = _cycleSymptomRepository.InsertCycleSymptom(cycleSymptom);
            if (!success)
            {
                return BadRequest("Failed to create cycle symptom");
            }

            return CreatedAtAction(nameof(GetCycleSymptomById), new { id = cycleSymptom.cycleSymptomId }, cycleSymptom);
        }

        // PUT: api/cyclesymptom
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdateCycleSymptom(CycleSymptom cycleSymptom)
        {
            // Check if cycle symptom exists
            var existingCycleSymptom = _cycleSymptomRepository.GetById(cycleSymptom.cycleSymptomId);
            if (existingCycleSymptom == null)
            {
                return NotFound($"Cycle symptom with ID {cycleSymptom.cycleSymptomId} not found");
            }
            
            // Get cycle for date validation
            var cycle = _periodCycleRepository.GetById(existingCycleSymptom.cycleId);
            
            // Validate intensity
            if (cycleSymptom.intensity < 1 || cycleSymptom.intensity > 5)
            {
                return BadRequest("Intensity must be between 1 and 5");
            }

            // Validate that the symptom date is within the cycle date range
            if (cycleSymptom.date < cycle.startDate || cycleSymptom.date > cycle.endDate)
            {
                return BadRequest($"Symptom date must be within the cycle date range ({cycle.startDate.ToShortDateString()} to {cycle.endDate.ToShortDateString()})");
            }

            // Only allow updating intensity and date
            existingCycleSymptom.intensity = cycleSymptom.intensity;
            existingCycleSymptom.date = cycleSymptom.date;

            bool success = _cycleSymptomRepository.UpdateCycleSymptom(existingCycleSymptom);
            if (!success)
            {
                return BadRequest("Failed to update cycle symptom");
            }

            return Ok(existingCycleSymptom);
        }

        // DELETE: api/cyclesymptom/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycleSymptom(int id)
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

        // DELETE: api/cyclesymptom/cycle/{cycleId}
        [HttpDelete("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteCycleSymptomsByCycleId(int cycleId)
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
    }
}