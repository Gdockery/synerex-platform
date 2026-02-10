import {Component} from '@angular/core';

@Component({
  template: `
  	<div class="col-md-6">
	    <div class="content-box">
	      <meter-chart [title]="'Internal Usage (kWh)'" [type]="'kwh'"></meter-chart>
	    </div>
	</div>
	<div class="col-md-6">
	    <div class="content-box">
	      <meter-chart [title]="'Kilowatt Peak'" [type]="'kwp'"></meter-chart>
	    </div>
	</div>
  `,
})
export class ChartingComponent {
}
