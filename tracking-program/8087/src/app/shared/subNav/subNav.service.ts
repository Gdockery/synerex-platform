import { Injectable } from '@angular/core';


@Injectable()
export class SubNavService {
  public title: string = '';

  public setTitle(title) {
    this.title = title;
  }
}
