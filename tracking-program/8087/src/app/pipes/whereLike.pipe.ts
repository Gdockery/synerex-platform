import { Pipe, PipeTransform  } from '@angular/core';
import { isArray, getProperty } from 'angular-pipes/src/utils/utils';

@Pipe({
  name: 'whereLike'
})
export class WhereLikePipe implements PipeTransform {
  transform (input: any, fn: any): any {
    if (isArray(fn)) {
      const [key, value] = fn;
      return input.filter(function(item: any) {
        return !value || getProperty(item, key).toLowerCase().indexOf(value.toLowerCase()) !== -1
      });
    }
  }
}
