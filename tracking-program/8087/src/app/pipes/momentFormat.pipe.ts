import { Pipe, PipeTransform  } from '@angular/core';
import {TimeHelpers} from "../shared/helpers/timeHelpers.service";

@Pipe({
  name: 'momentFormat'
})
export class MomentFormatPipe implements PipeTransform {

  constructor(private timeHelpers: TimeHelpers) {}

  transform (input: any, format: any): any {
    return this.timeHelpers.moment(input, format);
  }
}
