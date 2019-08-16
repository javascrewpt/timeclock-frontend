import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimeclockService } from '../timeclock.service';
import { FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { Day } from '../day';
import * as moment from 'moment';
import { catchError, tap, map, switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';

moment.locale('sl');

@Component({
  selector: 'app-timeclock-crud',
  templateUrl: './timeclock-crud.component.html',
  styleUrls: ['./timeclock-crud.component.css']
})
export class TimeclockCrudComponent implements OnInit, OnDestroy {

  daysForm;
  workspaces;
  unsubscribeSignal$: Subject<void> = new Subject();

  loading;
  startDate;
  hours: string[] = [];
  defaultWorkspaceLabel = 'Podjetje';
  defaultHoursLabel = 'Število ur';

  constructor(
    private tcService: TimeclockService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.loading = true;

    const workspaces$ = this.tcService.getWorkplaces().pipe(
      tap(workspaces => this.workspaces = workspaces)
    );
    const days$ = this.route.params.pipe(
      tap(params => {
        if (params.hasOwnProperty('week')) {
          const [week, year] = params.week.split('_');
          if (week && year) {
            this.startDate = moment(+year, 'YYYY').week(+week).day(1);
          }
        } else {
          this.startDate = moment(moment(new Date())).startOf('isoWeek');
        }
      }
      ),
      switchMap(params => params.hasOwnProperty('week') ? this.tcService.getDays(params.week) : this.tcService.getDays(null))
    );

    combineLatest(workspaces$, days$).pipe(
      catchError(_ => [[], []]),
      takeUntil(this.unsubscribeSignal$)
    ).subscribe(([, currentDays]) => {
      console.warn(currentDays);
      this.daysForm = this.fb.group({
        days: this.fb.array(this.generateWeeks())
      });

      const days = [];
      this.daysForm.value.days.forEach(day => {
        const exists = currentDays.find(item => moment(item.date, 'YYYY-MM-DD').isSame(moment(day.date, 'YYYY-MM-DD')));
        if (exists) {
          days.push({
            ...day,
            workplace_id: exists.workplace_id,
            date: exists.date,
            hours: exists.hours_formated
          });
        } else {
          days.push(day);
        }
      });

      this.daysForm.patchValue({
        days
      });

      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.unsubscribeSignal$.next();
    this.unsubscribeSignal$.unsubscribe();
  }

  generateHours(): string[] {
    const hours = [];
    const start = moment(new Date(0, 0, 0, 0, 0));
    for (let i = 0; i < 96; i++) {
      hours.push(start.format('HH:mm'));
      start.add(15, 'minutes');
    }
    hours.push('24:00');
    return hours;
  }

  private generateWeeks(): any[] {
    const days = [];
    // const startOfWeek = moment(new Date(2019, 7, 15)).startOf('isoWeek').subtract(1, 'week');
    const startOfWeek = this.startDate;
    for (let i = 0; i < 5; i++) {
      const current = startOfWeek.add(i === 0 ? 0 : 1, 'days');
      days.push(this.fb.group({
        workplace_id: ['', []],
        date: [current.format('YYYY-MM-DD'), [Validators.required]],
        hours: ['', []],
      }));
    }
    return days;
  }

  get days(): FormArray {
    return this.daysForm.get('days') as FormArray;
  }

  // todo subscribe to value changes

  onChanges(index: number): void {
    const control = (this.daysForm.get('days') as FormArray).at(index);
    const { workplace_id, hours } = control.value;
    const controlHours = control.get('hours');
    const controlWorkplace = control.get('workplace_id');
    /*
      controlWorkplace.hasError('required') && controlWorkplace.setValue('');
      controlHours.hasError('required') && controlHours.setValue('');
    */

    if (workplace_id !== '' && hours === '') {
      controlHours.setErrors({ required: true });
      controlHours.markAsTouched();
      return;
    }

    if (workplace_id === '' && hours !== '') {
      controlWorkplace.setErrors({ required: true });
      controlWorkplace.markAsTouched();
      return;
    }

    if (controlWorkplace.hasError('required')) {
      controlWorkplace.setValue('');
    }

    if (controlHours.hasError('required')) {
      controlHours.setValue('');
    }
  }


  onSubmit(): void {
    const { value, valid } = this.daysForm.get('days') as FormArray;

    if (valid) {
      const sendToBackend = value.filter(item => item.workplace_id !== '' && item.hours !== '');
      if (sendToBackend.length > 0) {
        this.tcService.postDays(sendToBackend).subscribe(data => console.log(data));
      }
    }
  }

  onChangeDate(newDate: string): void {
    this.loading = true;
    this.router.navigate(['/casovnice', newDate]);
  }

  formatDate(value: number): string {
    return moment(value).format('dddd, D. M. YYYY');
  }

}
