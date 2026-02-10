import {Component, Input, ViewChild} from '@angular/core';

@Component({
  selector: 'snapshot-gauge',
  template: `    
    <div>
      <div style="font-size: 10px; text-align: center; color:#459658"><strong>{{title}}</strong></div>
      <div style="font-size: 12px; text-align: center; width: 100%"><strong>{{value | round}}{{unit}}</strong></div>
      <div style="width: 100%;height:50px;float:right">
        <gauge-chart #gauge [color]="color"></gauge-chart>
      </div>
      <div style="text-align:left; color:#459658; font-size: 12px; text-align:center;"><strong>{{subtitle}}</strong></div>
    </div>
    <div class="clearfix"></div>
      
  `,
  styles: [ `
    :host {
      display:inline-block;
      width:100%;
      height:100%;
    }
  `]
})
export class SnapshotGaugeComponent {
  @Input() public title;
  @Input() public subtitle;
  @Input() public color;
  @Input() public unit;

  @ViewChild('gauge', {static: false}) gauge;
  private value;

  setValue(value, percent) {
    this.value = value;
    this.gauge.setPercent(percent);
  }
}
