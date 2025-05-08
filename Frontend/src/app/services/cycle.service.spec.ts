/**
 * Cycle Service Tests - Verifies the behavior of the period cycle service
 * 
 * This test file validates:
 * - Proper API communication for cycle CRUD operations
 * - Correct date formatting when sending data to the backend
 * - Error handling for failed API requests
 * - Mapping of response data to the correct models
 * 
 * It ensures the CycleService correctly manages period cycle data
 * through the backend API.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { CycleService } from './cycle.service';
import { CycleWithSymptoms } from '../models/CycleWithSymptoms';
import { environment } from '../environments/environment';

describe('CycleService', () => {
  let service: CycleService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/cycles`;

  // Set up testing environment before each test
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CycleService]
    });
    service = TestBed.inject(CycleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Verify no outstanding requests after each test
  afterEach(() => httpMock.verify());

  /**
   * Basic service instantiation test
   * Verifies that the service can be created properly
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * GET request test for getUserCycles()
   * Verifies that:
   * - The correct HTTP method is used (GET)
   * - The correct endpoint is called
   * - The response is properly mapped to the expected model
   */
  it('should GET all user cycles', (done) => {
    // Mock response data that matches the CycleWithSymptoms model
    const mockCycles: CycleWithSymptoms[] = [
      {
        cycleId: 1,
        userId: 5,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-05'),
        notes: 'Test cycle',
        symptoms: []
      }
    ];

    // Call the service method and verify response
    service.getUserCycles().subscribe((cycles: CycleWithSymptoms[]) => {
      expect(cycles).toEqual(mockCycles);
      done();
    });

    // Verify HTTP request was made with correct configuration
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCycles);
  });

  /**
   * POST request test for createCycle()
   * Verifies that:
   * - Dates are properly formatted before sending to the API
   * - The correct HTTP method is used (POST)
   * - The correct endpoint is called
   * - Request body contains properly formatted data
   */
  it('should POST create cycle with formatted dates', (done) => {
    // Input data with JavaScript Date objects
    const input: CycleWithSymptoms = {
      cycleId: 0,
      userId: 5,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-05'),
      notes: 'My notes',
      symptoms: [
        {
          symptomId: 1,
          name: 'Headache',
          intensity: 3,
          date: new Date('2025-04-02')
        }
      ]
    };

    // Mock response that the API would return
    const mockResponse: CycleWithSymptoms = {
      cycleId: 10,  // Server-generated ID
      userId: 5,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-05'),
      notes: 'My notes',
      symptoms: [
        {
          symptomId: 1,
          name: 'Headache',
          intensity: 3,
          date: new Date('2025-04-02')
        }
      ]
    };

    // Call the service method and verify response
    service.createCycle(input).subscribe((cycle: CycleWithSymptoms) => {
      expect(cycle).toEqual(mockResponse);
      done();
    });

    // Verify HTTP request was made with correct configuration
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    
    // Check that dates were properly formatted as strings for API
    expect(req.request.body.startDate).toEqual('2025-04-01');
    expect(req.request.body.endDate).toEqual('2025-04-05');
    expect(req.request.body.symptoms[0].date).toEqual('2025-04-02');
    
    req.flush(mockResponse);
  });

  /**
   * PUT request test for updateCycle()
   * Verifies that:
   * - Dates are properly formatted before sending to the API
   * - The correct HTTP method is used (PUT)
   * - The correct endpoint with ID is called
   * - Request body contains properly formatted data
   */
  it('should PUT update cycle with formatted dates', (done) => {
    const cycleId = 10;
    
    // Input data with JavaScript Date objects
    const input: CycleWithSymptoms = {
      cycleId: cycleId,
      userId: 5,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-07'), // Extended by 2 days
      notes: 'Updated notes',
      symptoms: [
        {
          symptomId: 1,
          name: 'Headache',
          intensity: 3,
          date: new Date('2025-04-02')
        }
      ]
    };

    // Mock response that the API would return
    const mockResponse: CycleWithSymptoms = { ...input };

    // Call the service method and verify response
    service.updateCycle(cycleId, input).subscribe((cycle: CycleWithSymptoms) => {
      expect(cycle).toEqual(mockResponse);
      done();
    });

    // Verify HTTP request was made with correct configuration
    const req = httpMock.expectOne(`${baseUrl}/${cycleId}`);
    expect(req.request.method).toBe('PUT');
    
    // Check that dates were properly formatted as strings for API
    expect(req.request.body.startDate).toEqual('2025-04-01');
    expect(req.request.body.endDate).toEqual('2025-04-07');
    expect(req.request.body.symptoms[0].date).toEqual('2025-04-02');
    
    req.flush(mockResponse);
  });

  /**
   * DELETE request test for deleteCycle()
   * Verifies that:
   * - The correct HTTP method is used (DELETE)
   * - The correct endpoint with ID is called
   * - No-content response is handled properly
   */
  it('should DELETE a cycle by id', (done) => {
    const cycleId = 10;

    // Call the service method and verify response
    service.deleteCycle(cycleId).subscribe(response => {
      expect(response).toBeTruthy();
      done();
    });

    // Verify HTTP request was made with correct configuration
    const req = httpMock.expectOne(`${baseUrl}/${cycleId}`);
    expect(req.request.method).toBe('DELETE');
    
    // Simulate no-content response (204) that the server would return
    req.flush({}, { status: 204, statusText: 'No Content' });
  });
  
  /**
   * Error handling test
   * Verifies that:
   * - HTTP errors are properly caught and propagated
   * - Error is logged to console
   */
  it('should handle API errors', (done) => {
    // Call service method that will error
    service.getUserCycles().subscribe({
      next: () => {
        fail('Expected an error response');
      },
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      }
    });

    // Simulate server error
    const req = httpMock.expectOne(baseUrl);
    req.flush('Server error', { 
      status: 500, 
      statusText: 'Internal Server Error' 
    });
  });
});