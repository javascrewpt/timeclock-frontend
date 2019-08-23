import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';

/*
  auth
  curl --data '{"email":"elvir@bosna.ba","password":"foo13"}' -H 'Content-Type: application/json'
  http://timeclock.loudandnoisy.com/api/auth/login  -H "Accept: application/json"
dobis nazaj hash in potem ga das v header tkle
  curl -H 'Authorization: Bearer 848f80404d060a27532c6107b224965358355f1044f40ed3635428d8028fd220'
  http://timeclock.loudandnoisy.com/api/timeclock
*/

interface IUser {
  logged: boolean;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // private status$ = new BehaviorSubject<any>(localStorage.getItem('token') ? { logged: true, user: {} } : { logged: false, user: null });
  private status$ = new Subject<IUser>();
  private url = 'api';
  constructor(private http: HttpClient) {
    if (localStorage.getItem('token')) {
      this.getUserData().subscribe(data => console.log(data));
    }
  }

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

  getUserData(): Observable<any> {
    return this.http.get<any>(`${this.url}/user`).pipe(
      tap(data => this.status$.next({ logged: true, user: data }))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.url}/auth/login`, { email, password }).pipe(
      switchMap(response => {
        if (response && response.data) {
          localStorage.setItem('token', response.data);
          return this.getUserData();
        } else {
          return of(false);
        }
      }),
      catchError(this.handleError('login', null))
    );
  }

  logout(): Observable<boolean> {
    localStorage.removeItem('token');
    this.status$.next(null);
    return of(true);
  }

  get Status() {
    return this.status$;
  }
}
