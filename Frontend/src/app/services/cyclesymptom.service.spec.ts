// src/app/services/cyclesymptom.service.spec.ts

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import {
  CycleSymptomService,
  CreateCycleSymptomDto,
  CycleSymptom
} from './cyclesymptom.service';   // match your actual file name

describe('CycleSymptomService', () => {
  let service: CycleSymptomService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:5113/api/CycleSymptom';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CycleSymptomService]
    });
    service  = TestBed.inject(CycleSymptomService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST createCycleSymptom and return the created item', (done) => {
    const dto: CreateCycleSymptomDto = {
      cycleId:   42,
      symptomId: 7,
      intensity: 3,
      date:      '2025-05-01'
    };
    const mockResponse: CycleSymptom = {
      cycleSymptomId: 123,
      cycleId:        42,
      symptomId:      7,
      intensity:      3,
      date:           '2025-05-01',
      createdAt:      '2025-05-02T08:00:00Z',
      symptom: {
        symptomId: 7,
        name:      'Cramps'
      }
    };

    service.createCycleSymptom(dto).subscribe((result: CycleSymptom) => {
      expect(result).toEqual(mockResponse);
      done();
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('should GET cycle symptoms by cycleId', (done) => {
    const cycleId = 42;
    const mockList: CycleSymptom[] = [
      {
        cycleSymptomId: 1,
        cycleId:        42,
        symptomId:      5,
        intensity:      2,
        date:           '2025-05-01',
        createdAt:      '2025-05-01T12:00:00Z',
        symptom: {
          symptomId: 5,
          name:      'Headache'
        }
      },
      {
        cycleSymptomId: 2,
        cycleId:        42,
        symptomId:      3,
        intensity:      1,
        date:           '2025-05-02',
        createdAt:      '2025-05-02T09:30:00Z',
        symptom: {
          symptomId: 3,
          name:      'Bloating'
        }
      }
    ];

    service.getCycleSymptomsByCycleId(cycleId)
      .subscribe((list: CycleSymptom[]) => {
        expect(list).toEqual(mockList);
        done();
      });

    const req = httpMock.expectOne(`${baseUrl}/cycle/${cycleId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });
});
