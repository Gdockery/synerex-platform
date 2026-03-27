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
              [legend]="true"
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
  @Input() public limitValue: number | null = null;  // Optional IEEE limit horizontal line
  @Input() public yAxisLabel: string = '';
  @Input() public xAxisLabel: string = 'Date';

  private labels = ['',''];

  public barChartOptions:any;

  public data = [{data: [], backgroundColor: '#9ca5d7', barThickness: 15}];

  constructor() {}

  ngOnInit() {
    this.barChartOptions = {
      scaleShowVerticalLines: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          gridLines: { display: false },
          display: true,
          ticks: { beginAtZero: this.beginAtZero },
          scaleLabel: this.yAxisLabel
            ? { display: true, labelString: this.yAxisLabel, fontColor: '#666', fontSize: 12 }
            : { display: false },
        }],
        xAxes: [{
          gridLines: { display: false },
          scaleLabel: this.xAxisLabel
            ? { display: true, labelString: this.xAxisLabel, fontColor: '#666', fontSize: 12 }
            : { display: false },
        }]
      }
    };
  }

  setData(data, labels = null) {
    const datasets = [...data];
    // Inject a flat horizontal line dataset for the IEEE 519 limit if configured
    if (this.limitValue !== null && this.limitValue !== undefined) {
      const labelCount = labels ? labels.length : (data[0] && data[0].data ? data[0].data.length : 10);
      datasets.push({
        type: 'line',
        data: Array(labelCount).fill(this.limitValue),
        label: 'IEEE 519 Limit',
        borderColor: '#e74c3c',
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        backgroundColor: 'transparent',
      });
    }
    this.data = datasets;
    if (labels) {
      this.chart.chart.config.data.labels = labels;
    }
  }

}
