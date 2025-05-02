using Microsoft.AspNetCore.Mvc;
using PeriodTracker.Model.Entities;
using PeriodTracker.Model.Repositories;

namespace PeriodTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CycleEntryController : ControllerBase
    {
        private readonly CycleEntryRepository _cycleEntryRepository;
        private readonly PeriodCycleRepository _periodCycleRepository;
        private readonly CalendarRepository _calendarRepository;

        public CycleEntryController(CycleEntryRepository cycleEntryRepository, PeriodCycleRepository periodCycleRepository, CalendarRepository calendarRepository)
        {
            _cycleEntryRepository = cycleEntryRepository;
            _periodCycleRepository = periodCycleRepository;
            _calendarRepository = calendarRepository;
        }

        // GET: api/cycleentry/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleEntry> GetEntryById(int id)
        {
            var entry = _cycleEntryRepository.GetById(id);
            if (entry == null)
            {
                return NotFound($"Cycle entry with ID {id} not found");
            }
            
            return Ok(entry);
        }

        // GET: api/cycleentry/cycle/{cycleId}
        [HttpGet("cycle/{cycleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<CycleEntry>> GetEntriesByCycleId(int cycleId)
        {
            // Check if cycle exists
            var cycle = _periodCycleRepository.GetById(cycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {cycleId} not found");
            }
            
            var entries = _cycleEntryRepository.GetEntriesByCycleId(cycleId);
            return Ok(entries);
        }

        // GET: api/cycleentry/calendar/{calendarId}
        [HttpGet("calendar/{calendarId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<CycleEntry>> GetEntriesByCalendarId(int calendarId)
        {
            // Check if calendar exists
            var calendar = _calendarRepository.GetById(calendarId);
            if (calendar == null)
            {
                return NotFound($"Calendar with ID {calendarId} not found");
            }
            
            var entries = _cycleEntryRepository.GetEntriesByCalendarId(calendarId);
            return Ok(entries);
        }

        // GET: api/cycleentry/date/{date}
        [HttpGet("date/{date}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<CycleEntry>> GetEntriesByDate(DateTime date)
        {
            // The date parameter will be automatically bound from the route
            // Format should be yyyy-MM-dd (ISO 8601)
            var entries = _cycleEntryRepository.GetEntriesByDate(date);
            return Ok(entries);
        }

        // POST: api/cycleentry
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<CycleEntry> CreateEntry(CycleEntry entry)
        {
            // Check if cycle exists
            var cycle = _periodCycleRepository.GetById(entry.cycleId);
            if (cycle == null)
            {
                return NotFound($"Period cycle with ID {entry.cycleId} not found");
            }
            
            // Check if calendar exists
            var calendar = _calendarRepository.GetById(entry.calendarId);
            if (calendar == null)
            {
                return NotFound($"Calendar with ID {entry.calendarId} not found");
            }

            // Validate that the entry date is within the cycle date range
            if (entry.date < cycle.startDate || entry.date > cycle.endDate)
            {
                return BadRequest($"Entry date must be within the cycle date range ({cycle.startDate.ToShortDateString()} to {cycle.endDate.ToShortDateString()})");
            }

            // Validate that the entry date matches the calendar month/year
            short calendarMonth;
            if (short.TryParse(calendar.month, out calendarMonth))
            {
                // If calendar.month is a numeric value
                if (entry.date.Month != calendarMonth || entry.date.Year != calendar.year)
                {
                    return BadRequest($"Entry date must match calendar month/year (Month: {calendar.month}, Year: {calendar.year})");
                }
            }
            else
            {
                // If calendar.month is a month name, convert entry.date.Month to month name for comparison
                string entryMonthName = new DateTime(2000, entry.date.Month, 1).ToString("MMMM");
                if (entryMonthName != calendar.month || entry.date.Year != calendar.year)
                {
                    return BadRequest($"Entry date must match calendar month/year (Month: {calendar.month}, Year: {calendar.year})");
                }
            }

            bool success = _cycleEntryRepository.InsertEntry(entry);
            if (!success)
            {
                return BadRequest("Failed to create cycle entry");
            }

            return CreatedAtAction(nameof(GetEntryById), new { id = entry.entryId }, entry);
        }

        // DELETE: api/cycleentry/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult DeleteEntry(int id)
        {
            // Check if entry exists
            var existingEntry = _cycleEntryRepository.GetById(id);
            if (existingEntry == null)
            {
                return NotFound($"Cycle entry with ID {id} not found");
            }

            bool success = _cycleEntryRepository.DeleteEntry(id);
            if (!success)
            {
                return BadRequest("Failed to delete cycle entry");
            }

            return NoContent();
        }
    }
}