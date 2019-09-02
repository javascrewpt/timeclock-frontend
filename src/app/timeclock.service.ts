import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Day } from './day';

@Injectable({
  providedIn: 'root'
})
export class TimeclockService {

  private url = 'api';

  constructor(private http: HttpClient) { }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  getDays(when: string | null): Observable<Day[]> {
    const params = !when ? '' : '/' + when;
    return this.http.get<any>(`${this.url}/timeclock${params}`).pipe(
      map(response => response.result === true ? response.data : []),
      catchError(this.handleError<Day[]>('getDays', []))
    );
  }

  getWorkplaces(): Observable<any> {
    return this.http.get<any>(`${this.url}/workplaces`).pipe(
      map(response => response.result === true ? response.data : []),
      catchError(this.handleError<any>('getWorkplaces', []))
    );
  }

  /*
primer za dodajanje
[{"workplace_id":"1","date":"2019-01-01", "hours":"08:00"},{"workplace_id":"1","date":"2019-01-02", "hours":"08:15"}]
  */
  // http://timeclock.loudandnoisy.com/api/timeclock/add
  postDays(days: Day[]): Observable<Day[]> {
    return this.http.post<any>(`${this.url}/timeclock/add`, days).pipe(
      tap(data => console.log(data)),
      map(response => response.data),
      catchError(this.handleError('post all', []))
    );
  }

  // timeclock/{id}/remove
  deleteDay(id: number): Observable<any> {
    return this.http.get(`${this.url}/timeclock/${id}/remove`).pipe(
      tap(result => console.log(result)),
      catchError(this.handleError('Delete one', {}))
    );
  }
}
