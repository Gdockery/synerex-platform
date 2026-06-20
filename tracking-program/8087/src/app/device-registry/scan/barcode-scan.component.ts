import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceRegistryService } from '../device-registry.service';

/**
 * Phase 3 — Barcode / QR Scanner.
 *
 * Detection strategy (in order of preference):
 *  1. Live camera — native BarcodeDetector API (Chrome 83+, iOS 17+, Android WebView)
 *  2. Live camera — ZXing BrowserMultiFormatReader (Firefox, older browsers)
 *  3. <input type="file" capture="environment"> photo decode via BarcodeDetector or ZXing
 *  4. Backend server-side decode (/api/device-registry/scan-barcode) if JS decode fails
 *  5. Manual text entry — always available
 *
 * ZXing is loaded lazily (dynamic import) so it does not bloat the main bundle.
 * On success the device serial is verified against /api/device-registry/verify-barcode.
 */
@Component({
  selector: 'app-barcode-scan',
  template: `
    <div class="container-fluid">
      <h3><span class="fa fa-qrcode"></span> Scan Device Barcode</h3>
      <hr/>

      <!-- Live camera scanner (BarcodeDetector or ZXing + getUserMedia) -->
      <div *ngIf="liveSupported" class="panel panel-default">
        <div class="panel-heading">
          <strong>Live Camera</strong>
          <small class="text-muted pull-right">{{ detectorLabel }}</small>
        </div>
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

  @ViewChild('videoEl', { static: false }) videoEl: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: false }) canvasEl: ElementRef<HTMLCanvasElement>;

  liveSupported = false;
  cameraActive = false;
  scanning = false;
  loading = false;
  selectedFile: File | null = null;
  photoPreviewUrl: string | null = null;
  manualSerial = '';
  result: any = null;
  error: string | null = null;
  detectorLabel = '';

  private stream: MediaStream | null = null;
  private nativeDetector: any = null;
  private zxingReader: any = null;        // BrowserMultiFormatReader from @zxing/browser
  private useNative = false;
  private scanInterval: any = null;

  constructor(
    private deviceRegistryService: DeviceRegistryService,
    private router: Router
  ) {}

  ngOnInit() {
    const hasCamera = !!(
      (navigator as any).mediaDevices &&
      (navigator as any).mediaDevices.getUserMedia
    );
    if (!hasCamera) return;

    if ((window as any).BarcodeDetector) {
      this.useNative = true;
      this.nativeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8',
                  'upc_a', 'upc_e', 'data_matrix', 'aztec', 'pdf417'],
      });
      this.liveSupported = true;
      this.detectorLabel = 'Native BarcodeDetector';
    } else {
      // ZXing fallback for Firefox and other browsers
      import('@zxing/browser').then(mod => {
        this.zxingReader = new mod.BrowserMultiFormatReader();
        this.liveSupported = true;
        this.detectorLabel = 'ZXing (Firefox-compatible)';
      }).catch(() => {
        // ZXing unavailable — live scan disabled, photo/manual still work
        this.detectorLabel = '';
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

    if (this.useNative) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          this.stream = stream;
          this.cameraActive = true;
          const video = this.videoEl.nativeElement;
          video.srcObject = stream;
          video.play();
          this.scanning = true;
          this.scanInterval = setInterval(() => this.detectFromVideoNative(), 800);
        })
        .catch(err => {
          this.error = `Camera access denied or unavailable: ${err.message}`;
        });
    } else if (this.zxingReader) {
      this.cameraActive = true;
      this.scanning = true;
      const video = this.videoEl.nativeElement;
      this.zxingReader.decodeFromVideoDevice(
        undefined, video,
        (result: any, err: any) => {
          if (result) {
            this.stopCamera();
            this.verify(result.getText());
          }
        }
      ).catch((err: any) => {
        this.cameraActive = false;
        this.scanning = false;
        this.error = `Camera error: ${err && err.message ? err.message : err}`;
      });
    }
  }

  stopCamera() {
    clearInterval(this.scanInterval);
    this.scanning = false;
    this.cameraActive = false;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.zxingReader && !this.useNative) {
      try { this.zxingReader.reset(); } catch (_) {}
    }
  }

  private detectFromVideoNative() {
    if (!this.nativeDetector || !this.cameraActive) return;
    const video = this.videoEl.nativeElement;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    this.nativeDetector.detect(video)
      .then((barcodes: any[]) => {
        if (barcodes && barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          this.stopCamera();
          this.verify(value);
        }
      })
      .catch(() => { /* keep scanning */ });
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

    if (this.useNative && this.nativeDetector) {
      createImageBitmap(this.selectedFile)
        .then(bitmap => this.nativeDetector.detect(bitmap))
        .then((barcodes: any[]) => {
          this.loading = false;
          if (barcodes && barcodes.length > 0) {
            this.verify(barcodes[0].rawValue);
          } else {
            this._tryBackendDecode();
          }
        })
        .catch(() => this._tryBackendDecode());

    } else if (this.zxingReader && this.photoPreviewUrl) {
      this.zxingReader.decodeFromImageUrl(this.photoPreviewUrl)
        .then((result: any) => {
          this.loading = false;
          this.verify(result.getText());
        })
        .catch(() => this._tryBackendDecode());

    } else {
      this._tryBackendDecode();
    }
  }

  private _tryBackendDecode() {
    if (!this.selectedFile) { this.loading = false; return; }
    const fd = new FormData();
    fd.append('image', this.selectedFile);
    this.deviceRegistryService.scanBarcodeImage(fd).subscribe(
      (res: any) => {
        this.loading = false;
        if (res && res.barcode) {
          this.verify(res.barcode);
        } else {
          this.error = 'No barcode detected. Try a clearer image or use manual entry.';
        }
      },
      () => {
        this.loading = false;
        this.error = 'Barcode scan failed. Try manual entry.';
      }
    );
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
        const d = res.response || res.device || res;
        if (d && d.id) {
          this.result = {
            ok: true,
            serial: d.serial_number || value,
            device_type: d.device_type,
            status: d.status,
            device_id: d.id,
          };
        } else if (res && res.found === false) {
          this.result = { ok: false, message: `No device found for: ${value}` };
        } else if (d && d.found !== undefined) {
          this.result = { ok: d.found, message: d.found ? '' : `No device found for: ${value}` };
        } else {
          this.result = { ok: false, message: `No device found for: ${value}` };
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
