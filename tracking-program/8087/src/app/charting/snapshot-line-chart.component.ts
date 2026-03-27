import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: 'snapshot-line-chart',
  template: `    
    <h3 style="text-align:center; font-weight:20">{{title}}</h3>
    <canvas baseChart width="380" height="200"
            [datasets]="data"
            [labels]="labels"
            [options]="options"
            [colors]="colors"
            [legend]="true"
            [chartType]="'line'"></canvas>
  `,
  styles: [ `
    :host {
      display:block;
      height: 200px;
    }
  `]
})
export class SnapshotLineChartComponent implements OnInit {

  @ViewChild(BaseChartDirective, {static: false}) chart: BaseChartDirective;

  @Input() beginAtZero = false;

  public options:any;

  @Input() colors:Array<any> = [
    {
      borderColor: '#26c49d',
      lineTension: 0,
      fill: false,
      pointRadius: 0,
    },
    {
      borderColor: '#3386FF',
      lineTension: 0,
      fill: false,
      pointRadius: 0,
    },
    {
      borderColor: '#FA8072',
      lineTension: 0,
      fill: false,
      pointRadius: 0,
    }
  ];

  public labels:Array<any>;

  public data = [{data: []}, {data: []}, {data: []}];

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
      },
    };
  }

  setData(chartData, labels) {
    this.data = chartData;
    this.chart.chart.config.data.labels = labels;
  }

  /** Update axis labels at runtime without re-creating the chart. */
  setAxisLabels(yLabel: string, xLabel: string = 'Time') {
    if (!this.chart || !this.chart.chart) { return; }
    const cfg = this.chart.chart.config.options.scales;
    if (cfg.yAxes && cfg.yAxes[0]) {
      cfg.yAxes[0].scaleLabel = { display: true, labelString: yLabel, fontColor: '#666', fontSize: 12 };
    }
    if (cfg.xAxes && cfg.xAxes[0]) {
      cfg.xAxes[0].scaleLabel = { display: true, labelString: xLabel, fontColor: '#666', fontSize: 12 };
    }
    this.chart.chart.update();
  }

}
