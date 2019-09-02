import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, take } from 'rxjs/operators';
import { UserService } from './user.service';

// https://medium.com/front-end-weekly/angular-how-to-implement-conditional-custom-validation-1ec14b0feb45
@Injectable({
  providedIn: 'root'
})
export class AuthenticationInterceptor implements HttpInterceptor {

  constructor(private router: Router, private userService: UserService) { }

  /*
elvir@bosna.ba
foo13
  */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      req = req.clone({
        headers: req.headers.set(
          'Authorization',
          `Bearer ${authToken}`
        )
      });
    }
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.router.url !== '/') {
          if (authToken) {
            localStorage.removeItem('token');
          }
          this.router.navigate(['']);
          return throwError(error);
        }
        // If it is not an authentication error, just throw it
        return throwError(error);
      })
    );
  }
}
