import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceRegistryService } from '../device-registry.service';

/**
 * Phase 3 — Barcode / QR Scanner.
 *
 * Strategy (in order of preference):
 *  1. Live camera feed + BarcodeDetector API (Chrome/Android, iOS 17+)
 *  2. <input type="file" capture="environment"> — picks a photo and decodes it
 *     using BarcodeDetector if available, otherwise falls back to manual entry.
 *  3. Manual text entry always available as a fallback.
 *
 * On success the device serial is verified against /api/device-registry/verify-barcode.
 */
@Component({
  selector: 'app-barcode-scan',
  template: `
    <div class="container-fluid">
      <h3><span class="fa fa-qrcode"></span> Scan Device Barcode</h3>
      <hr/>

      <!-- Live camera scanner (BarcodeDetector + getUserMedia) -->
      <div *ngIf="liveSupported" class="panel panel-default">
        <div class="panel-heading"><strong>Live Camera</strong></div>
        <div class="panel-body text-center">
          <video #videoEl autoplay playsinline
                 style="width:100%;max-width:480px;border-radius:6px;"></video>
          <canvas #canvasEl style="display:none;"></canvas>
          <div class="scan-overlay" *ngIf="scanning">
            <p class="text-muted"><span class="fa fa-spinner fa-spin"></span> Scanning…</p>
          </div>
          <div class="btn-group" style="margin-top:10px;">
            <button class="btn btn-primary" (click)="startCamera()" [disabled]="cameraActive || loading">
              <span class="fa fa-camera"></span> Start Camera
            </button>
            <button class="btn btn-default" (click)="stopCamera()" [disabled]="!cameraActive">
              Stop
            </button>
          </div>
        </div>
      </div>

      <!-- Photo capture fallback -->
      <div class="panel panel-default">
        <div class="panel-heading"><strong>Capture Photo</strong>
          <small class="text-muted pull-right">(mobile: opens camera)</small>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label for="photoInput">Take or choose a photo of the barcode / QR code</label>
            <input #photoInput id="photoInput" type="file"
                   accept="image/*" capture="environment"
                   class="form-control"
                   (change)="onPhotoSelected($event)">
          </div>
          <div *ngIf="photoPreviewUrl" class="text-center" style="margin:10px 0;">
            <img [src]="photoPreviewUrl" style="max-width:100%;max-height:300px;border-radius:4px;"/>
          </div>
          <button class="btn btn-success" (click)="decodePhoto()" [disabled]="!selectedFile || loading">
            <span [class]="loading ? 'fa fa-spinner fa-spin' : 'fa fa-search'"></span>
            {{ loading ? 'Detecting…' : 'Detect Barcode' }}
          </button>
        </div>
      </div>

      <!-- Manual entry (always available) -->
      <div class="panel panel-default">
        <div class="panel-heading"><strong>Manual Entry</strong></div>
        <div class="panel-body">
          <div class="form-group">
            <label for="manualSerial">Serial / barcode value</label>
            <div class="input-group">
              <input type="text" id="manualSerial" class="form-control"
                     [(ngModel)]="manualSerial"
                     placeholder="e.g. SYN-20230001"
                     (keydown.enter)="verifyManual()">
              <span class="input-group-btn">
                <button class="btn btn-primary" (click)="verifyManual()" [disabled]="!manualSerial || loading">
                  Verify
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Result panel -->
      <div *ngIf="result" class="alert" [ngClass]="result.ok ? 'alert-success' : 'alert-danger'">
        <span [class]="result.ok ? 'fa fa-check-circle' : 'fa fa-times-circle'"></span>
        &nbsp;<strong>{{ result.ok ? 'Device found' : 'Not found' }}</strong><br/>
        <span *ngIf="result.ok">
          Serial: <code>{{ result.serial }}</code><br/>
          Type: {{ result.device_type }}&nbsp;|&nbsp;Status: {{ result.status }}
        </span>
        <span *ngIf="!result.ok">{{ result.message }}</span>
        <div *ngIf="result.ok" class="text-right" style="margin-top:10px;">
          <a [routerLink]="['/device-registry', result.device_id]" class="btn btn-sm btn-info">
            View Device
          </a>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-warning">
        <span class="fa fa-exclamation-triangle"></span> {{ error }}
      </div>

      <hr/>
      <a [routerLink]="['/device-registry']" class="btn btn-default">
        <span class="fa fa-arrow-left"></span> Back to Device List
      </a>
    </div>
  `,
  styles: [`
    .scan-overlay { margin-top: 8px; }
    video { background: #000; }
  `]
})
export class BarcodeScanComponent implements OnInit, OnDestroy {

  @ViewChild('videoEl') videoEl: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl: ElementRef<HTMLCanvasElement>;

  liveSupported = false;
  cameraActive = false;
  scanning = false;
  loading = false;
  selectedFile: File | null = null;
  photoPreviewUrl: string | null = null;
  manualSerial = '';
  result: any = null;
  error: string | null = null;

  private stream: MediaStream | null = null;
  private barcodeDetector: any = null;
  private scanInterval: any = null;

  constructor(
    private deviceRegistryService: DeviceRegistryService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check browser support
    this.liveSupported = !!(
      (navigator as any).mediaDevices &&
      (navigator as any).mediaDevices.getUserMedia &&
      (window as any).BarcodeDetector
    );

    if (this.liveSupported) {
      this.barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix']
      });
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  // ── Live camera ────────────────────────────────────────────────────────────

  startCamera() {
    this.error = null;
    this.result = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        this.stream = stream;
        this.cameraActive = true;
        const video = this.videoEl.nativeElement;
        video.srcObject = stream;
        video.play();
        this.scanning = true;
        this.scanInterval = setInterval(() => this.detectFromVideo(), 800);
      })
      .catch(err => {
        this.error = `Camera access denied or unavailable: ${err.message}`;
      });
  }

  stopCamera() {
    clearInterval(this.scanInterval);
    this.scanning = false;
    this.cameraActive = false;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  private detectFromVideo() {
    if (!this.barcodeDetector || !this.cameraActive) return;
    const video = this.videoEl.nativeElement;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    this.barcodeDetector.detect(video)
      .then((barcodes: any[]) => {
        if (barcodes && barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          this.stopCamera();
          this.verify(value);
        }
      })
      .catch(() => { /* detection error — keep scanning */ });
  }

  // ── Photo capture ──────────────────────────────────────────────────────────

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    this.selectedFile = input.files[0];
    this.result = null;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e: any) => { this.photoPreviewUrl = e.target.result; };
    reader.readAsDataURL(this.selectedFile);
  }

  decodePhoto() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.error = null;
    this.result = null;

    if ((window as any).BarcodeDetector) {
      // Use native BarcodeDetector on the image file
      createImageBitmap(this.selectedFile).then(bitmap => {
        return this.barcodeDetector.detect(bitmap);
      }).then((barcodes: any[]) => {
        this.loading = false;
        if (barcodes && barcodes.length > 0) {
          this.verify(barcodes[0].rawValue);
        } else {
          this.error = 'No barcode detected in photo. Try a clearer image or use manual entry.';
        }
      }).catch((err: any) => {
        this.loading = false;
        this.error = `Barcode detection failed: ${err.message}. Try manual entry.`;
      });
    } else {
      // No BarcodeDetector — send image to backend for server-side decode attempt
      const fd = new FormData();
      fd.append('image', this.selectedFile);
      this.deviceRegistryService.scanBarcodeImage(fd).subscribe(
        (res: any) => {
          this.loading = false;
          if (res && res.barcode) {
            this.verify(res.barcode);
          } else {
            this.error = 'No barcode detected. Try manual entry.';
          }
        },
        (err: any) => {
          this.loading = false;
          this.error = 'Barcode scan failed. Try manual entry.';
        }
      );
    }
  }

  // ── Manual entry ───────────────────────────────────────────────────────────

  verifyManual() {
    if (!this.manualSerial) return;
    this.verify(this.manualSerial.trim());
  }

  // ── Shared verify ──────────────────────────────────────────────────────────

  private verify(value: string) {
    this.loading = true;
    this.error = null;
    this.result = null;
    this.deviceRegistryService.verifyBarcode(value).subscribe(
      (res: any) => {
        this.loading = false;
        const device = res.response || res;
        if (device && device.id) {
          this.result = {
            ok: true,
            serial: device.serial_number || value,
            device_type: device.device_type,
            status: device.status,
            device_id: device.id,
          };
        } else {
          this.result = { ok: false, message: `No device found for barcode: ${value}` };
        }
      },
      (err: any) => {
        this.loading = false;
        this.result = {
          ok: false,
          message: err.error?.error || `Device not found for barcode: ${value}`,
        };
      }
    );
  }
}
