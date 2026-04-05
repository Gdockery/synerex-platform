# Create-from-Bill Review Step - Manual Patch

The HTML file is in .cursorignore. Apply these changes to `src/app/project/create-from-bill/create-from-bill-wizard.component.html`:

## 1. Update steps indicator (around line 7-12)

Replace:
```html
  <ul class="steps-indicator list-inline">
    <li [class.active]="step >= 1" [class.done]="step > 1">1. Upload</li>
    <li [class.active]="step >= 2" [class.done]="step > 2">2. Client</li>
    ...
```

With:
```html
  <ul class="steps-indicator list-inline">
    <li [class.active]="step >= 1" [class.done]="step > 1">1. Upload</li>
    <li [class.active]="step >= 2" [class.done]="step > 2">2. Review</li>
    <li [class.active]="step >= 3" [class.done]="step > 3">3. Client</li>
    <li [class.active]="step >= 4" [class.done]="step > 4">4. Project</li>
    <li [class.active]="step >= 5" [class.done]="step > 5">5. Bill Analytic</li>
    <li [class.active]="step >= 6" [class.done]="step > 6">6. Summary</li>
  </ul>
```

## 2. Add Review step (step 2) - insert AFTER the step 1 div (before step 2 Client div)

```html
  <div *ngIf="step === 2" class="content-box">
    <h4>Review Extraction</h4>
    <p class="text-muted">Verify the extracted data matches your bill. Highlights: Energy (blue), Demand (orange), Charges (green), Metadata (purple).</p>
    <div class="row">
      <div class="col-md-5">
        <h5>Extracted Data</h5>
        <p><strong>Total kWh:</strong> {{ scanData?.totalKwh || '-' }}</p>
        <p><strong>kW Peak:</strong> {{ scanData?.kwPeak || '-' }}</p>
        <p><strong>Bill Amount:</strong> ${{ scanData?.billAmount || '-' }}</p>
        <p><strong>Account:</strong> {{ scanData?.accountNumber || '-' }}</p>
        <p><strong>Utility:</strong> {{ scanData?.electricCompanyName || '-' }}</p>
      </div>
      <div class="col-md-7">
        <h5>Bill PDF (highlighted)</h5>
        <div *ngIf="highlightedPages?.length" class="bill-review-pages">
          <img *ngFor="let p of highlightedPages" [src]="'data:image/png;base64,' + p.imageBase64" 
               alt="Page {{ p.page }}" class="img-responsive" style="max-width:100%; margin-bottom:8px; border:1px solid #ddd;">
        </div>
        <p *ngIf="!highlightedPages?.length" class="text-muted">No highlights available</p>
      </div>
    </div>
    <button class="btn btn-primary mt-2" (click)="nextStep()">Next</button>
    <button class="btn btn-default ml-1" (click)="prevStep()">Back</button>
  </div>

  <div *ngIf="step === 3" class="content-box">
```

## 3. Change existing step numbers

- Current "step === 2" (Client) -> change to "step === 3"
- Current "step === 3" (Project) -> change to "step === 4"
- Current "step === 4" (Bill) -> change to "step === 5"
- Current "step === 5" (Summary) -> change to "step === 6"
