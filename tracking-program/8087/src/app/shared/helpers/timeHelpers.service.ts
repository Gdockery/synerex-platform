import { Injectable } from '@angular/core';
import {CurrentUserService} from "../user/currentUser.service";
import {date} from "ng2-validation/dist/date";

let momentTz = require('moment-timezone');
let moment = require('moment');

@Injectable()
export class TimeHelpers {
  constructor(private userService: CurrentUserService) {}

  momentForUserTz(params = {}, format = null){
    if(format) {
      return momentTz(params, format).tz(this.userService.user.selectedProject.timeZoneId);
    }
    return momentTz(params).tz(this.userService.user.selectedProject.timeZoneId);
  }

  momentForUserTzUnadjusted(params = {}, format = null){
    if(format) {
      return momentTz.tz(params, format, this.userService.user.selectedProject.timeZoneId);
    }
    return momentTz.tz(params, this.userService.user.selectedProject.timeZoneId);
  }

  moment(params = {}, format = null) {
    if(format) {
      return moment(params, format);
    }
    return moment(params);
  }

  getDatepickerDictionaryFromString(dateInput, format = "MM-DD-YYYY") {
    return this.getDatepickerDictionary(this.moment(dateInput, format));
  }

  getDatepickerDictionary(momentDate) {
    return {date:{year: momentDate.year(), month: momentDate.month() + 1, day: momentDate.date()}};
  }

  formatDatepickerDictionary(datepickerDict, format = 'YYYY-MM-DD', projectTz = true) {
    let momentObj = this.getMomentFromDatepickerDictionary(datepickerDict, projectTz);
    if(momentObj) {
      return momentObj.format(format);
    }
    return '';
  }

  getMomentFromDatepickerDictionary(datepickerDict, projectTz = true) {
    if(datepickerDict) {
      let date = JSON.parse(JSON.stringify(datepickerDict));
      date.month--;
      return projectTz ? this.momentForUserTzUnadjusted(date) : this.moment(date);
    }
    return null;
  }

  getUnixTimeFromDatepickerDictionary(datepickerDict) {
    if(datepickerDict) {
      return this.getMomentFromDatepickerDictionary(datepickerDict).valueOf();
    }
  }
}
