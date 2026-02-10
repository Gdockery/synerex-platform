import { NgModule } from '@angular/core';
import {MonthYearPickerReactiveComponent} from "./month-year-picker-reactive.component";
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  declarations: [
    MonthYearPickerReactiveComponent
  ],
  providers: [
  ],
  exports: [
    MonthYearPickerReactiveComponent
  ]
})
export class FormComponentsModule {}
