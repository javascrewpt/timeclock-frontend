import { TestBed } from '@angular/core/testing';

import { TimeclockService } from './timeclock.service';

describe('TimeclockService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TimeclockService = TestBed.get(TimeclockService);
    expect(service).toBeTruthy();
  });
});
