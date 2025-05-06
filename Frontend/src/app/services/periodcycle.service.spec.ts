// src/app/services/periodcycle.service.spec.ts

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { PeriodCycleService } from './periodcycle.service';
import { Periodcycle } from '../models/Periodcycle';
import { environment } from '../environments/environment';

describe('PeriodCycleService', () => {
  let service: PeriodCycleService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/periodcycle`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PeriodCycleService]
    });
    service  = TestBed.inject(PeriodCycleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET cycles by userId', (done) => {
    const userId = 5;
    const mockCycles: Periodcycle[] = [
      {
        cycleId:   1,
        userId:    5,
        startDate: new Date('2025-04-01'),
        endDate:   new Date('2025-04-05'),
        notes:     'Test',
        duration:  4,
        createdAt: new Date('2025-04-05')
      }
    ];

    service.getCyclesByUserId(userId).subscribe((cycles: Periodcycle[]) => {
      expect(cycles).toEqual(mockCycles);
      done();
    });

    const req = httpMock.expectOne(`${baseUrl}/user/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCycles);
  });

  it('should POST createCycle with adapted dates', (done) => {
    const input: Periodcycle = {
      cycleId:   0,
      userId:    5,
      startDate: new Date('2025-04-01'),
      endDate:   new Date('2025-04-05'),
      notes:     'My notes',
      duration:  0,
      createdAt: new Date()
    };

    const adapted = {
      cycleId:   0,
      userId:    5,
      startDate: '2025-04-01T00:00:00.000Z',
      endDate:   '2025-04-05T00:00:00.000Z',
      notes:     'My notes'
    };

    const mockResponse: Periodcycle = {
      cycleId:   10,
      userId:    5,
      startDate: new Date('2025-04-01'),
      endDate:   new Date('2025-04-05'),
      notes:     'My notes',
      duration:  4,
      createdAt: new Date('2025-04-10')
    };

    service.createCycle(input).subscribe((cycle: Periodcycle) => {
      expect(cycle).toEqual(mockResponse);
      done();
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(adapted);
    req.flush(mockResponse);
  });

  it('should DELETE cycle by id/userId', (done) => {
    const id = 10;
    const userId = 5;

    service.deleteCycle(id, userId).subscribe(response => {
      expect(response).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(`${baseUrl}/${id}/user/${userId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({}, { status: 204, statusText: 'No Content' });
  });
});
