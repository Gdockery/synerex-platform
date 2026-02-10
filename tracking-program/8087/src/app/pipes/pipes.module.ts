import {NgModule} from '@angular/core';
import {WhereLikePipe} from "./whereLike.pipe";
import {ProjectTzMomentPipe} from "./projectTzMoment.pipe";
import {MomentFormatPipe} from "./momentFormat.pipe";
import {CosmeticTimePipe} from "./cosmeticTime.pipe";
import {ProjectCurrencyPipe} from "./projectCurrencyPipe.pipe";
import {CurrencyPipe} from "@angular/common";

@NgModule({
  imports: [],
  declarations: [WhereLikePipe, ProjectTzMomentPipe, MomentFormatPipe, CosmeticTimePipe, ProjectCurrencyPipe],
  exports: [WhereLikePipe, ProjectTzMomentPipe, MomentFormatPipe, CosmeticTimePipe, ProjectCurrencyPipe],
  providers: [CurrencyPipe],
})
export class PipesModule {}
