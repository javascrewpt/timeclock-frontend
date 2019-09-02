import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimeclockService } from '../timeclock.service';
import { FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { Day } from '../day';
import * as moment from 'moment';
import { catchError, tap, map, switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

moment.locale('sl');

@Component({
  selector: 'app-timeclock-crud',
  templateUrl: './timeclock-crud.component.html',
  styleUrls: ['./timeclock-crud.component.css']
})
export class TimeclockCrudComponent implements OnInit, OnDestroy {

  daysForm;
  workspaces;

  loading: boolean;
  startDate: moment.Moment;
  hours: string[] = [];
  unsubscribeSignal$: Subject<void> = new Subject();

  edit: any[] = [];
  defaultWorkspaceLabel = 'Podjetje';
  defaultHoursLabel = 'Število ur';

  constructor(
    private tcService: TimeclockService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.loading = true;

    // Get observables ready for combineLatest
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
          this.startDate = moment().startOf('isoWeek');
        }
      }
      ),
      switchMap(params => params.hasOwnProperty('week') ? this.tcService.getDays(params.week) : this.tcService.getDays(null))
    );

    // execute both observables
    combineLatest(workspaces$, days$).pipe(
      catchError(_ => [[], []]),
      takeUntil(this.unsubscribeSignal$)
    ).subscribe(([, currentDays]) => {
      // url changed, so reset temp values for edit
      this.edit = [];

      this.daysForm = this.fb.group({
        days: this.fb.array(this.generateWeeks())
      });

      const days = [];
      this.daysForm.value.days.forEach(day => {
        const exists = currentDays.find(item => moment(item.date, 'YYYY-MM-DD').isSame(moment(day.date, 'YYYY-MM-DD')));
        if (exists) {
          days.push({
            ...day,
            id: exists.id,
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
    const startOfWeek = this.startDate;
    for (let i = 0; i < 7; i++) {
      const current = startOfWeek.add(i === 0 ? 0 : 1, 'days');
      days.push(this.fb.group({
        id: [null, []],
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

  getWorkplaceName(workplaceId: number) {
    return workplaceId ? this.workspaces.find(workplace => workplace.id === +workplaceId).name : 'NO DATA TOMMY!';
  }

  onChanges(index: number): void {
    const control = (this.daysForm.get('days') as FormArray).at(index);
    const { workplace_id, hours } = control.value;
    const controlHours = control.get('hours');
    const controlWorkplace = control.get('workplace_id');

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

  setEdit(index: number) {
    this.edit[index] = this.daysForm.get('days').at(index).value;
  }

  cancelEdit(index: number) {
    this.daysForm.get('days').at(index).patchValue({ ...this.edit[index] });
    this.edit.splice(index, 1);
  }

  delete(index: number) {
    if (confirm(`Želiš izbrisati zapis?`)) {
      const day = this.daysForm.get('days').at(index).value;

      this.tcService.deleteDay(day.id).pipe(
        takeUntil(this.unsubscribeSignal$)
      ).subscribe(response => {
        console.log(response, day.id, index);
      });
    }
  }

  saveOne(index: number) {
    const selectedDay = this.daysForm.get('days').at(index);
    const forDay = moment(selectedDay.value.date, 'YYYY-MM-DD').format('DD. MM. YYYY');
    // check if dirty!
    this.tcService.postDays([selectedDay.value]).pipe(
      takeUntil(this.unsubscribeSignal$)
    ).subscribe(data => {
      const day = data[0] as any;
      this.daysForm.get('days').at(index).patchValue({
        id: day.id,
        workplace_id: day.workplace_id,
        date: day.date,
        hours: day.hours_formated,
      });
      this.snackBar.open(`Podatki za dan ${forDay} so shranjeni.`, '', {
        duration: 3000
      });
      this.edit[index] = null;
    });
  }

  onSubmit(): void {
    const { valid } = this.daysForm.get('days') as FormArray;

    if (valid) {
      const insertedDays = [];
      for (const [index, day] of (this.daysForm.get('days') as FormArray).controls.entries()) {
        const { value, dirty } = day;
        if (dirty) {
          insertedDays.push({ index, data: value });
        }
      }

      if (insertedDays.length > 0) {
        const daysToSave = insertedDays.map(item => item.data);
        this.tcService.postDays(daysToSave).pipe(
          takeUntil(this.unsubscribeSignal$)
        ).subscribe(data => {
          const patchData = data.map((item: any) => ({
            id: item.id,
            workplace_id: item.workplace_id,
            date: moment(item.date).format('YYYY-MM-DD'),
            hours: item.hours_formated,
          }));

          for (const day of insertedDays) {
            this.daysForm.get('days').at(day.index).patchValue(patchData.find(item => item.date === day.data.date));
          }

          this.snackBar.open('Podatki za celotni teden so bili shranjeni.', undefined, {
            duration: 3000
          });
        });
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
