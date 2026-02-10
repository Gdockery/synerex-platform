import { Pipe, PipeTransform  } from '@angular/core';
import {CurrencyPipe} from "@angular/common";
import {CurrentUserService} from "../shared/user/currentUser.service";

@Pipe({
  name: 'projectCurrency'
})
export class ProjectCurrencyPipe implements PipeTransform {

  private currency;

  constructor(private currencyPipe: CurrencyPipe, private currentUserService: CurrentUserService) {
    this.currency = this.currentUserService.user.selectedProject.currencyCode;
  }

  transform (value: any, symbolDisplay?: ("code"|"symbol"|"symbol-narrow"), digits?: string): any {
    return this.currencyPipe.transform(value, this.currency, symbolDisplay, digits);
  }
}
