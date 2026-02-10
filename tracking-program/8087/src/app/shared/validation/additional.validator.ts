import {FormArray, FormControl} from '@angular/forms';

var _ = require('lodash');

export class AdditionalValidators {
  static multipleCheckboxRequireOne(fa: FormArray) {
    let valid = false;
    for(let i in fa.controls) {
      if(fa.controls[i].value.value) {
        valid = true;
        break;
      }
    }
    return valid ? null : {
      multipleCheckboxRequireOne: true
    };
  }

  static fullName(control: FormControl) {
    if (_.trim(control.value).split(/\s+/).length < 2) {
      return {
          contains: true
      };
    }
  }

  static divisibleByField(otherField) {
    return (control: FormControl): {[key: string]: any} => {
      if(control.parent) {
        let otherValue = control.parent.controls[otherField].value;
        if(control.value % (otherValue * 2) != 0) {
          return {
            invalidDivisibleBy: true
          };
        }
      }
    }
  }

  static greaterThanField(otherField) {
    return (control: FormControl): {[key: string]: any} => {
      if(control.parent) {
        let otherValue = control.parent.controls[otherField].value;
        if(otherValue !> control.value) {
          return {
            invalidGreaterThan: true
          };
        }
      }
    }
  }

  static numberIsNotNegative(control: FormControl) {
    if ( control.value > 0 ) {
      return {
          notNegative: true
      };
    }
  }


}
