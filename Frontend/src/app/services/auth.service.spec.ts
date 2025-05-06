import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

interface LoginResponse {
  userId?: number;
  name?:   string;
  email:   string;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const loginUrl = `${environment.apiUrl}/auth/login`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear any leftover storage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store header and body on successful login', (done) => {
    const dummyBody: LoginResponse = {
      userId: 1,
      name:   'John Doe',
      email:  'john.doe'
    };
    const dummyHeader = 'Basic am9obi5kb2U6VmVyeVNlY3JldCE=';

    service.login('john.doe', 'VerySecret!').subscribe(body => {
      // Verify the observable yields the JSON body
      expect(body).toEqual(dummyBody);

      // Verify localStorage was set
      expect(localStorage.getItem('authHeader')).toBe(dummyHeader);
      expect(localStorage.getItem('isAuthenticated')).toBe('true');
      expect(localStorage.getItem('userEmail')).toBe('john.doe');
      expect(localStorage.getItem('userId')).toBe('1');
      expect(localStorage.getItem('userName')).toBe('John Doe');
      done();
    });

    // Expect one HTTP call
    const req = httpMock.expectOne(loginUrl);
    expect(req.request.method).toBe('POST');
    // Simulate the server returning both header and body
    req.flush(dummyBody, { headers: { Authorization: dummyHeader } });
  });

  it('should error on bad credentials', (done) => {
    service.login('wrong', 'bad').subscribe({
      next: () => fail('Expected an error response'),
      error: err => {
        // The service should pass through the 401
        expect(err.status).toBe(401);
        done();
      }
    });

    const req = httpMock.expectOne(loginUrl);
    req.flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized'
    });
  });
});
