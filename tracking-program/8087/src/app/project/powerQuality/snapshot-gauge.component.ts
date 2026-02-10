import {Component, Input, ViewChild} from '@angular/core';

@Component({
  selector: 'snapshot-gauge',
  template: `    
    <div class="box">
      {{title}} <br/>
      {{subtitle}}
      <div>
        <div style="height: 50px;position:relative;">
          <div style="bottom:0;position:absolute;display:inline-block;">{{value | round}}</div>
          <div style="width: 40%;height:50px;float:right">
            <gauge-chart #gauge [color]="color"></gauge-chart>
          </div>
        </div>
        <div class="clearfix"></div>
      </div>
    </div>
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

  @ViewChild('gauge', {static: false}) gauge;

  public value;

  setValue(value, percent) {
    this.value = value;
    this.gauge.setPercent(percent);
  }
}
