import { Pipe, PipeTransform  } from '@angular/core';
import {TimeHelpers} from "../shared/helpers/timeHelpers.service";

@Pipe({
  name: 'cosmeticTime'
})
export class CosmeticTimePipe implements PipeTransform {

  constructor(private timeHelpers: TimeHelpers) {}

  transform (input: any): any {
    //console.log(input)
    let now = (new Date).getTime()

    if(input > now - 120000) {
        input = now - 5000
    }

    return input
  }
}
