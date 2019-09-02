import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements CanActivate {

  constructor(private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    // console.log(next.params.week);

    if (state.url === '/' && localStorage.getItem('token')) {
      this.router.navigate(['casovnice']);
      return;
    }

    if (state.url !== '/' && !localStorage.getItem('token')) {
      this.router.navigate(['']);
      return false;
    }

    return true;
  }
}
