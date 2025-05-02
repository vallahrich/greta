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
    public class PeriodCycleController : ControllerBase
    {
        private readonly PeriodCycleRepository _periodCycleRepository;
        private readonly UserRepository _userRepository;
        private readonly CycleSymptomRepository _cycleSymptomRepository;

        public PeriodCycleController(
            PeriodCycleRepository periodCycleRepository, 
            UserRepository userRepository,
            CycleSymptomRepository cycleSymptomRepository)
        {
            _periodCycleRepository = periodCycleRepository;
            _userRepository = userRepository;
            _cycleSymptomRepository = cycleSymptomRepository;
        }

        // GET: api/periodcycle/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<PeriodCycle> GetCycleById(int id)
        {
            var cycle = _periodCycleRepository.GetById(id);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {id} not found");
            }
            
            return Ok(cycle);
        }

        // GET: api/periodcycle/user/{userId}
        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<PeriodCycle>> GetCyclesByUserId(int userId)
        {
            // Check if user exists
            var user = _userRepository.GetUserById(userId);
            if (user == null)
            {
                return NotFound($"User with ID {userId} not found");
            }
            
            var cycles = _periodCycleRepository.GetCyclesByUserId(userId);
            return Ok(cycles);
        }

        // GET: api/periodcycle/user/{userId}/average-duration
        [HttpGet("user/{userId}/average-duration")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<double> GetAverageCycleDuration(int userId)
        {
            // Check if user exists
            var user = _userRepository.GetUserById(userId);
            if (user == null)
            {
                return NotFound($"User with ID {userId} not found");
            }
            
            var averageDuration = _periodCycleRepository.GetAverageCycleDuration(userId);
            return Ok(averageDuration);
        }

        // POST: api/periodcycle
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<PeriodCycle> CreateCycle(PeriodCycle cycle)
        {
            // Check if user exists
            var user = _userRepository.GetUserById(cycle.userId);
            if (user == null)
            {
                return NotFound($"User with ID {cycle.userId} not found");
            }

            // Validate that endDate is after startDate
            if (cycle.endDate < cycle.startDate)
            {
                return BadRequest("End date must be after start date");
            }

            bool success = _periodCycleRepository.InsertCycle(cycle);
            if (!success)
            {
                return BadRequest("Failed to create period cycle");
            }

            return CreatedAtAction(nameof(GetCycleById), new { id = cycle.cycleId }, cycle);
        }

        // PUT: api/periodcycle
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult UpdateCycle(PeriodCycle cycle)
        {
            // Check if cycle exists
            var existingCycle = _periodCycleRepository.GetById(cycle.cycleId);
            if (existingCycle == null)
            {
                return NotFound($"Period cycle with ID {cycle.cycleId} not found");
            }
            
            // Ensure user owns the cycle
            if (existingCycle.userId != cycle.userId)
            {
                return BadRequest("You can only update your own period cycles");
            }

            // Validate that endDate is after startDate
            if (cycle.endDate < cycle.startDate)
            {
                return BadRequest("End date must be after start date");
            }

            bool success = _periodCycleRepository.UpdateCycle(cycle);
            if (!success)
            {
                return BadRequest("Failed to update period cycle");
            }

            return Ok(cycle);
        }

        // DELETE: api/periodcycle/{id}/user/{userId}
        [HttpDelete("{id}/user/{userId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult DeleteCycle(int id, int userId)
        {
            // Check if cycle exists
            var existingCycle = _periodCycleRepository.GetById(id);
            if (existingCycle == null)
            {
                return NotFound($"Period cycle with ID {id} not found");
            }
            
            // Ensure user owns the cycle
            if (existingCycle.userId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, "You can only delete your own period cycles");
            }

            // Delete any associated symptoms first
            _cycleSymptomRepository.DeleteCycleSymptomsByCycleId(id);

            // Delete the cycle
            bool success = _periodCycleRepository.DeleteCycle(id, userId);
            if (!success)
            {
                return BadRequest("Failed to delete period cycle");
            }

            return NoContent();
        }
    }
}