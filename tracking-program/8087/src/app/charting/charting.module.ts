import { NgModule } from '@angular/core';
import {ChartsModule} from "ng2-charts";
import {BarChartComponent} from "./bar-chart.component";
import {GaugeChartComponent} from "./gauge-chart.component";
import {LineChartComponent} from "./line-chart.component";
import {SnapshotLineChartComponent} from "./snapshot-line-chart.component";
//import {SnapshotColoredChartComponent} from "./snapshot-colored-chart.component";
import {LegendComponent} from "./legend.component";
import {CommonModule} from "@angular/common";


require('chart.js');

@NgModule({
  imports: [
    CommonModule,
    ChartsModule,
   
  ],
  declarations: [
    BarChartComponent,
    GaugeChartComponent,
    LineChartComponent,
    SnapshotLineChartComponent,
    LegendComponent,
    //SnapshotColoredChartComponent,
  ],
  exports: [
    BarChartComponent,
    GaugeChartComponent,
    LineChartComponent,
    SnapshotLineChartComponent,
    //SnapshotColoredChartComponent,
    LegendComponent
  ],
  providers: []
})
export class ChartingModule { }
