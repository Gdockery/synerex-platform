import { NgModule } from "@angular/core";
import { AgmCoreModule } from "@agm/core";
import { MapComponent } from "./map.component";
import { MapRoutingModule } from "./map-routing.module";

@NgModule({
  declarations: [
    MapComponent
  ],
  imports: [
    MapRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyBEg2JvX9O-zoMMW_LQh_UF-QIxyCeO9nE",
      libraries: ["places", "geometry"]
    })
  ],
  exports: [
    MapComponent
  ],
  providers: [
    MapComponent
  ]
})
export class MapModule {}