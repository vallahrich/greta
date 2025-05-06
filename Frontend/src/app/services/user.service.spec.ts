// src/app/services/user.service.spec.ts

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User } from '../models/User';
import { environment } from '../environments/environment';

interface PasswordUpdateRequest {
  UserId:   number;
  Password: string;
}

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/user`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service  = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('authHeader', 'Basic dummy'); // if your interceptor uses it
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET user by email', (done) => {
    const mockUser: User = {
      userId:   7,
      name:     'Alice',
      email:    'alice@example.com',
      pw:       'secret',
      createdAt: new Date()
    };

    service.getUserByEmail('alice@example.com').subscribe((user: User) => {
      expect(user).toEqual(mockUser);
      done();
    });

    const req = httpMock.expectOne(`${base}/byemail/alice@example.com`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should PUT updateUser and return updated user', (done) => {
    const toUpdate: User = {
      userId:    7,
      name:      'Alice Smith',
      email:     'alice@example.com',
      pw:        'secret',
      createdAt: new Date()
    };

    service.updateUser(toUpdate).subscribe((user: User) => {
      expect(user).toEqual(toUpdate);
      done();
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(toUpdate);
    req.flush(toUpdate);
  });

  it('should PUT updatePassword and handle success', (done) => {
    const userId = 7;
    const newPassword = 'newpass';

    service.updatePassword(userId, newPassword).subscribe(res => {
      expect(res).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(`${base}/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ UserId: userId, Password: newPassword } as PasswordUpdateRequest);
    req.flush({}, { status: 200, statusText: 'OK' });
  });

  it('should error 403 on updatePassword', (done) => {
    service.updatePassword(7, 'bad').subscribe({
      next: () => fail('should have thrown'),
      error: err => {
        expect(err.message).toContain('permission');
        done();
      }
    });

    const req = httpMock.expectOne(`${base}/password`);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('should DELETE user and handle success', (done) => {
    service.deleteUser(7).subscribe(res => {
      expect(res).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(`${base}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush({}, { status: 204, statusText: 'No Content' });
  });

  it('should error 404 on deleteUser', (done) => {
    service.deleteUser(8).subscribe({
      next: () => fail('should have thrown'),
      error: err => {
        expect(err.message).toContain('not found');
        done();
      }
    });

    const req = httpMock.expectOne(`${base}/8`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});
