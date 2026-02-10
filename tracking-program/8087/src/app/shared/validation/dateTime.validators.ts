import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {TimeHelpers} from "../helpers/timeHelpers.service";

require('moment-timezone');
let moment = require('moment');

export class DateTimeValidators {

  constructor(private timeHelpers: TimeHelpers) {}

  static beforeDateField(toDate) {
    return (control: FormControl): {[key: string]: any} => {
      if(control.parent && control.parent.controls[toDate].value && control.value) {
        let toDateControl: any = JSON.parse(JSON.stringify(control.parent.controls[toDate].value.date));
        let fromDateControl: any = JSON.parse(JSON.stringify(control.value.date));

        toDateControl.month--;
        fromDateControl.month--;

        let difference = moment(fromDateControl).diff(toDateControl, 'minutes');
        if (difference > 0) {
          return {
            invalidBeforeDateField: true
          };
        }
      }
    }
  }

  static afterDateField(fromDate) {
    return (control: FormControl): {[key: string]: any} => {
      if(control.parent && control.parent.controls[fromDate].value && control.value) {
        let fromDateControl:any = JSON.parse(JSON.stringify(control.parent.controls[fromDate].value.date));
        let toDateControl:any = JSON.parse(JSON.stringify(control.value.date));

        toDateControl.month--;
        fromDateControl.month--;

        let difference = moment(fromDateControl).diff(toDateControl, 'minutes');
        if(difference > 0) {
          return {
            invalidAfterDateField: true
          };
        }
      }
    }
  }

  static beforeTime(timeHelpers) {
    return (control: FormControl): {[key: string]: any} => {
      let dateControl: any = JSON.parse(JSON.stringify(control.value.date));
      dateControl.month--;

      let difference = timeHelpers.momentForUserTz().diff(timeHelpers.momentForUserTz(dateControl), 'minutes');
      if (difference < 0) {
        return {
          invalidBeforeToday: true
        };
      }
    }
  }

}
