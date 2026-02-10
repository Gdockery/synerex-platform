import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'gauge-chart',
  template: `    
    <canvas baseChart style="height:100%;width:100%"
            [datasets]="data"
            [labels]="['','']"
            [options]="barChartOptions"
            [legend]="false"
            [chartType]="'pie'"
            [colors]="['#26c49d', '#9ca5d7']"></canvas>
  `,
  styles: [ `
    :host {
      display:inline-block;
      width:100%;
      height:100%;
    }
  `]
})
export class GaugeChartComponent implements OnInit {

  @Input() public color = '#9ca5d7';

  public barChartOptions:any = {
    tooltips: {enabled: false},
    hover: {mode: null},
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false,
    cutoutPercentage: 70,
    circumference: Math.PI,
    rotation: Math.PI
  };

  public data = [{data: [50, 60], backgroundColor: [this.color, '#e0e0e0']}];

  ngOnInit() {
    this.data[0].backgroundColor[0] = this.color;
  }

  setPercent(percent) {
    let clone = JSON.parse(JSON.stringify(this.data));
    clone[0].data = [percent, 100 - percent];
    this.data = clone;
  }

}
