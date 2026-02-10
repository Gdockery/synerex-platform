import { Pipe, PipeTransform  } from '@angular/core';
import {TimeHelpers} from "../shared/helpers/timeHelpers.service";

@Pipe({
  name: 'projectTzMoment'
})
export class ProjectTzMomentPipe implements PipeTransform {

  constructor(private timeHelpers: TimeHelpers) {}

  transform (input: any, format: any = 'x'): any {
    return this.timeHelpers.momentForUserTz(input, format);
  }
}
