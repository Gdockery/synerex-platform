import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: 'line-chart',
  template: `    
    <h3 style="text-align:center; font-weight:700">{{title}}</h3>
    <canvas baseChart width="380" height="400"
            [datasets]="data"
            [labels]="labels"
            [options]="options"
            [colors]="colors"
            [legend]="false"
            [chartType]="'line'"></canvas>
  `,
  styles: [ `
    :host {
      display:block;
      height: 200px;
    }
  `]
})
export class LineChartComponent implements OnInit {

  @ViewChild(BaseChartDirective, {static: false}) chart: BaseChartDirective;

  @Input() beginAtZero = false;

  public options:any;

  @Input() colors:Array<any> = [
    {
      borderColor: '#26c49d',
    },
    {
      borderColor: '#9ca5d7',
    }
  ];

  public labels:Array<any>;

  public data = [{data: []},{data: []}];

  constructor() {}

  ngOnInit() {
    this.options = {
      scaleShowVerticalLines: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          gridLines: {
            display:false
          },
          ticks: {
            beginAtZero: this.beginAtZero
          },
        }],
        xAxes: [{
          gridLines: {
            display:false
          }
        }]
      }
    };
  }

  setData(chartData, labels) {
   this.data = chartData;

    //Hacky fix for issue of not being able to update labels in ng2-charts
    this.chart.chart.config.data.labels = labels;
  }

}
