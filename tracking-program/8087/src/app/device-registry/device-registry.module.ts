import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { DeviceRegistryService } from './device-registry.service';
import { ListDeviceRegistryComponent } from './list/list-device-registry.component';
import { BarcodeScanComponent } from './scan/barcode-scan.component';

/**
 * Phase 3 — Device Registry Angular module.
 * Routes:
 *   /device-registry           → list
 *   /device-registry/scan      → barcode / QR scanner (camera + file capture)
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild([
      {
        path: '',
        component: ListDeviceRegistryComponent,
        data: { title: 'Device Registry' }
      },
      {
        path: 'scan',
        component: BarcodeScanComponent,
        data: { title: 'Scan Barcode' }
      },
    ]),
  ],
  declarations: [
    ListDeviceRegistryComponent,
    BarcodeScanComponent,
  ],
  providers: [
    DeviceRegistryService,
  ],
})
export class DeviceRegistryModule {}
