import { Injectable } from '@angular/core';

@Injectable()
export class ObjectHelpers {

  static deepCopy(thing) {
    return JSON.parse(JSON.stringify(thing))
  }

}
