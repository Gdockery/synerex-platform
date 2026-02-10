import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MapComponent } from './map.component';
import { ProjectSelectedGuard } from '../shared/guards/projectSelected.guard';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
				path: '',
				component: MapComponent,
				canActivate:[ProjectSelectedGuard],
				children: [
					
				]
			},
    ])
  ],
  exports: [RouterModule]
})
export class MapRoutingModule { }
