import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: 'bar-chart',
  template: `    
    <h3 style="text-align:center; font-weight:700">{{title}}</h3>
      <canvas baseChart width="100%"
              [datasets]="data"
              [labels]="labels"
              [options]="barChartOptions"
              [legend]="false"
              [chartType]="'bar'"
              [colors]="colors"></canvas>
  `,
  styles: [ `
    :host {
      display:block;
    }
  `]
})
export class BarChartComponent implements OnInit {

  @ViewChild(BaseChartDirective, {static: false}) chart: BaseChartDirective;

  @Input() public type;
  @Input() public title;
  @Input() public height = 200;
  @Input() public colors = ['#26c49d'];
  @Input() public beginAtZero = false;

  private labels = ['',''];

  public barChartOptions:any;

  public data = [{data: [], backgroundColor: '#9ca5d7'}];

  constructor() {}

  ngOnInit() {
    this.barChartOptions = {
      scaleShowVerticalLines: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          gridLines: {
            display:false
          },
          display: true,
          ticks: {
            beginAtZero: this.beginAtZero   // minimum value will be 0.
          }
        }],
        xAxes: [{
          gridLines: {
            display:false
          },
          barThickness: 15
        }]
      }
    };
  }

  setData(data, labels = null) {
    this.data = data;
    if(labels) {
      // this.labels = labels;
      this.chart.chart.config.data.labels = labels;
    }
  }

}
