// src/app/services/symptom.service.spec.ts

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { SymptomService } from './symptom.service';
import { Symptom } from '../models/Symptom';
import { environment } from '../environments/environment';

describe('SymptomService', () => {
  let service: SymptomService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/symptom`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SymptomService]
    });
    service  = TestBed.inject(SymptomService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET all symptoms', (done) => {
    // Mock list of symptoms matching your Symptom interface
    const mockList: Symptom[] = [
      { symptomId: 1, name: 'Headache' },
      { symptomId: 2, name: 'Cramps' }
    ];

    service.getAllSymptoms().subscribe((symptoms: Symptom[]) => {
      expect(symptoms).toEqual(mockList);
      done();
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });
});
