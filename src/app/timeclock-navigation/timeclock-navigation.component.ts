import { Component, Output, EventEmitter, Input, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import * as moment from 'moment';

enum Directions {
  BACK = 'BACK',
  FORTH = 'FORTH'
}

@Component({
  selector: 'app-timeclock-navigation',
  templateUrl: './timeclock-navigation.component.html',
  styleUrls: ['./timeclock-navigation.component.css']
})
export class TimeclockNavigationComponent implements OnInit, OnChanges {

  @Input() date: moment.MomentInput;
  @Output() changeDate = new EventEmitter<string>();

  directions = Directions;
  from: string;
  to: string;
  outOfBounds: boolean;

  constructor() { }

  ngOnInit() {
    this.from = moment(this.date, 'YYYY MM DD').startOf('isoWeek').format('DD. MM. YYYY');
    this.to = moment(this.date, 'YYYY MM DD').format('DD. MM. YYYY');
  }

  ngOnChanges(changes: SimpleChanges) {
    this.checkOutOfBounds();
  }

  checkOutOfBounds() {
    const current = moment().format('w');
    const nextSelected = moment(this.date).add(1, 'week').format('w');
    if (+nextSelected > +current) {
      this.outOfBounds = true;
    } else {
      this.outOfBounds = false;
    }
  }

  onClick(direction: string) {
    const newDate: moment.Moment = direction === Directions.BACK
      ? moment(this.date).subtract(1, 'week')
      : moment(this.date).add(1, 'week');

    const week = newDate.format('W');
    const year = newDate.format('YYYY');
    this.changeDate.emit(`${week}_${year}`);
  }

}
