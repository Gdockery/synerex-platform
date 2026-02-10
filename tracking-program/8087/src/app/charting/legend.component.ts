import {Component, Input} from '@angular/core';

@Component({
  selector: 'legend',
  template: `
    <ul>
      <li *ngFor="let value of values;">
        <span class="oval" [ngStyle]="{'background':value.color}"></span><span class="text">{{value.text}}</span>
      </li>
    </ul>
  `,
  styles: [ `
    :host {
      display:block;
      border: none;
    }
    .text {
      padding-left: 5px;
    }
    li {
      padding-left: 5px;
      list-style:none;
      display:inline-block;
    }
  `]
})
export class LegendComponent {
  @Input() public values: Array<any> = [];
}
