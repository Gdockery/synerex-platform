/**
 * BarcodeScannerComponent
 *
 * A reusable modal that opens the iPad/device camera and decodes
 * Code 128 (and other 1D/2D) barcodes using @zxing/library.
 *
 * Falls back gracefully to manual text entry when:
 *  - The page is served over HTTP (getUserMedia blocked)
 *  - Camera permission is denied
 *  - No camera is found on the device
 *
 * Usage:
 *   <app-barcode-scanner
 *     [label]="'Scan Serial Number'"
 *     (scanned)="onSerialScanned($event)"
 *     (cancelled)="showScanner = false">
 *   </app-barcode-scanner>
 */
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

declare var require: any;

@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @Input()  label: string = 'Scan Barcode';
  @Input()  hint: string  = 'Point the camera at a Code 128 barcode on the device nameplate.';
  @Output() scanned   = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  manualValue = '';
  cameraActive = false;
  cameraError  = '';
  scanning     = false;
  scannedValue = '';
  confirmed    = false;
  httpsRequired = false;

  private _stream: MediaStream | null = null;
  private _reader: any = null;
  private _videoEl: HTMLVideoElement | null = null;
  private _raf: any = null;
  private _stopped = false;

  ngOnInit() {
    // Camera requires a secure context (HTTPS or localhost)
    var secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!secure) {
      this.httpsRequired = true;
      return;
    }
    this._startCamera();
  }

  ngOnDestroy() {
    this._stop();
  }

  private _startCamera() {
    this.scanning = true;
    this.cameraError = '';
    this._stopped = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraError = 'Camera not supported in this browser.';
      this.scanning = false;
      return;
    }

    var constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width:  { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    var self = this;

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      self._stream = stream;
      self.cameraActive = true;
      self.scanning = false;

      // Give Angular a tick to render the video element
      setTimeout(function() {
        var vid = document.getElementById('bs-video') as HTMLVideoElement;
        if (!vid) { self.cameraError = 'Could not attach camera feed.'; return; }
        self._videoEl = vid;
        vid.srcObject = stream;
        vid.play().then(function() {
          self._loadZXingAndScan();
        }).catch(function(e) {
          self.cameraError = 'Could not start camera: ' + (e && e.message ? e.message : '');
        });
      }, 100);

    }).catch(function(e) {
      self.scanning = false;
      self.cameraActive = false;
      if (e && e.name === 'NotAllowedError') {
        self.cameraError = 'Camera permission denied. Please allow camera access and try again.';
      } else if (e && e.name === 'NotFoundError') {
        self.cameraError = 'No camera found on this device.';
      } else {
        self.cameraError = 'Camera error: ' + (e && e.message ? e.message : 'Unknown error.');
      }
    });
  }

  private _loadZXingAndScan() {
    var self = this;
    try {
      var ZXing = require('@zxing/library');
      var hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.DATA_MATRIX,
        ZXing.BarcodeFormat.EAN_13,
      ]);
      self._reader = new ZXing.MultiFormatReader();
      self._reader.setHints(hints);
      self._scan();
    } catch (e) {
      self.cameraError = 'Barcode library failed to load. Use manual entry below.';
    }
  }

  private _scan() {
    if (this._stopped || !this._videoEl || !this._reader) return;
    var self = this;

    var vid = this._videoEl;
    if (vid.readyState < 2) {
      this._raf = requestAnimationFrame(function() { self._scan(); });
      return;
    }

    var canvas = document.createElement('canvas');
    canvas.width  = vid.videoWidth  || 640;
    canvas.height = vid.videoHeight || 480;
    var ctx = canvas.getContext('2d');
    if (!ctx) { this._raf = requestAnimationFrame(function() { self._scan(); }); return; }
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      var ZXing = require('@zxing/library');
      var luminance = new ZXing.RGBLuminanceSource(imageData.data, canvas.width, canvas.height);
      var binary = new ZXing.HybridBinarizer(luminance);
      var bitmap = new ZXing.BinaryBitmap(binary);
      var result = self._reader.decode(bitmap);
      if (result && result.getText()) {
        self._onDecoded(result.getText());
        return;
      }
    } catch (e) {
      // NotFoundException is thrown when no barcode found — this is normal, keep scanning
    }

    if (!this._stopped) {
      this._raf = requestAnimationFrame(function() { self._scan(); });
    }
  }

  private _onDecoded(value: string) {
    this._stop();
    this.scannedValue = value;
    this.confirmed = false;
  }

  private _stop() {
    this._stopped = true;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._stream) {
      this._stream.getTracks().forEach(function(t) { t.stop(); });
      this._stream = null;
    }
    this.cameraActive = false;
  }

  confirm() {
    var val = this.scannedValue || this.manualValue;
    if (val && val.trim()) {
      this.scanned.emit(val.trim());
    }
  }

  rescan() {
    this.scannedValue = '';
    this.manualValue  = '';
    this._startCamera();
  }

  cancel() {
    this._stop();
    this.cancelled.emit();
  }

  useManual() {
    this._stop();
    this.cameraError = '';
    this.httpsRequired = false;
  }

  submitManual() {
    if (this.manualValue && this.manualValue.trim()) {
      this.scanned.emit(this.manualValue.trim());
    }
  }
}
