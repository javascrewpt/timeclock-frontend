import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Beleženje ur';
  unsubscribeSignal$: Subject<void> = new Subject();

  constructor(private router: Router, public userService: UserService) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.unsubscribeSignal$.next();
    this.unsubscribeSignal$.unsubscribe();
  }

  onLogout() {
    this.userService.logout().pipe(
      takeUntil(this.unsubscribeSignal$)
    ).subscribe(success => success ? this.router.navigate(['']) : console.warn('error: ' + success));
  }
}
