import { NgModule } from '@angular/core';
import {CommonModule} from "@angular/common";
import {ClipboardDirective} from "./clipboard.directive";
import {HideIfUserLevel} from "./hideIfUserLevel.directive";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ClipboardDirective,
    HideIfUserLevel
  ],
  providers: [
  ],
  exports: [
    ClipboardDirective,
    HideIfUserLevel
  ]
})
export class DirectivesModule {}
