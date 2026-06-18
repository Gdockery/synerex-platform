import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'pipeline-detail',
  styles: [`
    .stage-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
    .stage-row:last-child { border-bottom: none; }
    .stage-dot { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
    .dot-done    { background: #27ae60; }
    .dot-waiting { background: #e67e22; }
    .dot-pending { background: #ddd; }
    .stage-body  { flex: 1; }
    .stage-name  { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
    .stage-date  { font-size: 12px; color: #888; }
    .stage-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .waiting-badge { background: #e67e22; color: #fff; font-size: 11px; font-weight: 700;
                     padding: 1px 7px; border-radius: 10px; margin-left: 8px; vertical-align: middle; }
    .section-header { font-size: 13px; font-weight: 700; color: #999; text-transform: uppercase;
                      letter-spacing: 1px; margin: 24px 0 8px; padding-bottom: 4px;
                      border-bottom: 2px solid #eee; }
  `],
  template: `
    <div class="container-fluid" style="max-width: 860px; padding: 20px;">
      <a [routerLink]="['/project/pipeline']" style="color: #3498db; font-size: 13px;">
        &larr; Back to Pipeline
      </a>

      <div *ngIf="loading" style="padding: 40px; text-align: center;">
        <span class="ss-loading"></span> Loading…
      </div>

      <div *ngIf="!loading && !project">
        <p class="text-danger">Project not found.</p>
      </div>

      <div *ngIf="!loading && project">
        <h3 style="margin-top: 16px; margin-bottom: 4px;">{{ project.name }}</h3>
        <div style="color: #777; margin-bottom: 12px;">
          {{ project.client_name }}<span *ngIf="project.location"> — {{ project.location }}</span>
        </div>

        <!-- ECBS Dashboard shortcut -->
        <div style="margin-bottom: 20px;">
          <button class="btn btn-success" (click)="openEcbsDashboard()"
            style="background: #00e676; color: #000; border: none; font-weight: 700; padding: 8px 20px; border-radius: 6px;">
            ⚡ Open ECBS Dashboard →
          </button>
        </div>

        <!-- Documents -->
        <div class="section-header">Documents</div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
          <a *ngIf="project.proposal_src" class="btn btn-xs btn-default"
             href="{{ project.proposal_src }}" target="_blank">
            View Proposal Contract PDF
          </a>
          <a *ngIf="!project.proposal_src" class="btn btn-xs btn-default disabled">
            Proposal not generated
          </a>
          <a *ngIf="project.deposit_invoice_src" class="btn btn-xs btn-default"
             href="/tracking-static/invoices/{{ project.deposit_invoice_src }}" target="_blank">
            Deposit Invoice
          </a>
          <a *ngIf="project.install_invoice_src" class="btn btn-xs btn-default"
             href="/tracking-static/invoices/{{ project.install_invoice_src }}" target="_blank">
            Install Invoice
          </a>
          <a *ngIf="project.final_invoice_src" class="btn btn-xs btn-default"
             href="/tracking-static/invoices/{{ project.final_invoice_src }}" target="_blank">
            Final Invoice
          </a>
          <a class="btn btn-xs btn-primary" [routerLink]="['/billing/savings-report/list']" (click)="selectProject()">
            Bill Analytic &amp; Proposal →
          </a>
        </div>

        <!-- Pipeline stages -->
        <div class="section-header">Pipeline</div>
        <div style="background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 0 20px;">

          <!-- 1. Bill Scanned -->
          <div class="stage-row">
            <div class="stage-dot" [class.dot-done]="project.bill_scanned_at" [class.dot-pending]="!project.bill_scanned_at"></div>
            <div class="stage-body">
              <div class="stage-name">Bill Scanned</div>
              <div class="stage-date" *ngIf="project.bill_scanned_at">{{ fmtMs(project.bill_scanned_at) }}</div>
              <div class="stage-date text-muted" *ngIf="!project.bill_scanned_at">Not yet</div>
            </div>
          </div>

          <!-- 2. SLD Uploaded -->
          <div class="stage-row">
            <div class="stage-dot" [class.dot-done]="project.sld_uploaded" [class.dot-pending]="!project.sld_uploaded"></div>
            <div class="stage-body">
              <div class="stage-name">SLD Uploaded</div>
              <div class="stage-date text-muted" *ngIf="!project.sld_uploaded">Optional — upload on Bill Analytic page</div>
              <div class="stage-date" *ngIf="project.sld_uploaded">Uploaded</div>
            </div>
          </div>

          <!-- 3. Proposal Generated -->
          <div class="stage-row">
            <div class="stage-dot" [class.dot-done]="project.proposal_generated" [class.dot-pending]="!project.proposal_generated"></div>
            <div class="stage-body">
              <div class="stage-name">Proposal Generated</div>
              <div class="stage-date text-muted" *ngIf="!project.proposal_generated">Generate on Bill Analytic page</div>
              <div class="stage-date" *ngIf="project.proposal_generated">PDF generated ✓</div>
            </div>
          </div>

          <!-- 4. Proposal Sent -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.proposal_sent_at"
              [class.dot-waiting]="!project.proposal_sent_at && project.proposal_generated"
              [class.dot-pending]="!project.proposal_sent_at && !project.proposal_generated">
            </div>
            <div class="stage-body">
              <div class="stage-name">
                Proposal Sent
                <span class="waiting-badge" *ngIf="project.proposal_sent_at && project.proposal_status !== 'approved'">Awaiting Approval</span>
              </div>
              <div class="stage-date" *ngIf="project.proposal_sent_at">Sent {{ fmtMs(project.proposal_sent_at) }}</div>
              <div class="stage-actions" *ngIf="!project.proposal_sent_at && project.proposal_generated">
                <button class="btn btn-xs btn-primary" (click)="mark('proposal_sent_at', true)" [disabled]="saving">Mark as Sent</button>
              </div>
              <div class="stage-actions" *ngIf="project.proposal_sent_at && !project.proposal_status">
                <button class="btn btn-xs btn-success" (click)="approveProposal()" [disabled]="saving">✓ Approve Proposal</button>
              </div>
            </div>
          </div>

          <!-- 5. Proposal Approved -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.proposal_status === 'approved'"
              [class.dot-waiting]="project.proposal_sent_at && project.proposal_status !== 'approved'"
              [class.dot-pending]="!project.proposal_sent_at">
            </div>
            <div class="stage-body">
              <div class="stage-name">Proposal Approved</div>
              <div class="stage-date" *ngIf="project.proposal_status === 'approved'">Approved ✓ — Landon notified</div>
              <div class="stage-date text-muted" *ngIf="project.proposal_sent_at && project.proposal_status !== 'approved'">Waiting for client approval</div>
              <div class="stage-actions" *ngIf="project.proposal_status !== 'approved' && isAdmin">
                <button class="btn btn-xs btn-success" (click)="approveProposal()" [disabled]="saving">✓ Mark Approved</button>
              </div>
            </div>
          </div>

          <!-- 6. Deposit Invoice Sent (30%) -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.deposit_invoice_sent_at"
              [class.dot-waiting]="!project.deposit_invoice_sent_at && project.proposal_status === 'approved'"
              [class.dot-pending]="!project.deposit_invoice_sent_at && project.proposal_status !== 'approved'">
            </div>
            <div class="stage-body">
              <div class="stage-name">
                Deposit Invoice Sent <small class="text-muted">(30%)</small>
                <span class="waiting-badge" *ngIf="project.deposit_invoice_sent_at && !project.deposit_paid_at">Awaiting Payment</span>
              </div>
              <div class="stage-date" *ngIf="project.deposit_invoice_sent_at">Sent {{ fmtMs(project.deposit_invoice_sent_at) }}</div>
              <div class="stage-actions" *ngIf="!project.deposit_invoice_sent_at && isAdmin">
                <button class="btn btn-xs btn-primary" (click)="mark('deposit_invoice_sent_at', true)" [disabled]="saving">Mark Sent</button>
              </div>
            </div>
          </div>

          <!-- 7. Deposit Paid -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.deposit_paid_at"
              [class.dot-waiting]="!project.deposit_paid_at && project.deposit_invoice_sent_at"
              [class.dot-pending]="!project.deposit_paid_at && !project.deposit_invoice_sent_at">
            </div>
            <div class="stage-body">
              <div class="stage-name">Deposit Paid</div>
              <div class="stage-date" *ngIf="project.deposit_paid_at">Received {{ fmtMs(project.deposit_paid_at) }}</div>
              <div class="stage-date text-muted" *ngIf="project.deposit_invoice_sent_at && !project.deposit_paid_at">Waiting for deposit payment</div>
              <div class="stage-actions" *ngIf="!project.deposit_paid_at && isAdmin">
                <button class="btn btn-xs btn-success" (click)="mark('deposit_paid_at', true)" [disabled]="saving">Mark Paid</button>
              </div>
            </div>
          </div>

          <!-- 8. PO Received -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.po_received_at"
              [class.dot-waiting]="!project.po_received_at && project.deposit_paid_at"
              [class.dot-pending]="!project.po_received_at && !project.deposit_paid_at">
            </div>
            <div class="stage-body">
              <div class="stage-name">
                PO Received
                <span class="waiting-badge" *ngIf="!project.po_received_at && project.deposit_paid_at">Awaiting PO</span>
              </div>
              <div class="stage-date" *ngIf="project.po_received_at">{{ fmtMs(project.po_received_at) }} — PO: {{ project.purchase_order }}</div>
              <div class="stage-actions" *ngIf="!project.po_received_at && isAdmin">
                <input #poInput type="text" class="form-control input-xs" placeholder="PO Number" style="width: 160px; display: inline-block;">
                <button class="btn btn-xs btn-success" (click)="savePO(poInput.value)" [disabled]="saving">Save PO</button>
              </div>
            </div>
          </div>

          <!-- 9. Shipped -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.tracking_number"
              [class.dot-pending]="!project.tracking_number">
            </div>
            <div class="stage-body">
              <div class="stage-name">Shipped</div>
              <div *ngIf="project.tracking_number">
                <div class="stage-date">
                  {{ project.carrier | uppercase }} — {{ project.tracking_number }}
                  <a *ngIf="project.tracking_url" [href]="project.tracking_url" target="_blank" style="margin-left: 8px;">Track →</a>
                </div>
              </div>
              <div class="stage-actions" *ngIf="!project.tracking_number && isAdmin">
                <select #carrierSel class="form-control input-xs" style="width: 130px; display: inline-block;">
                  <option value="arcbest">ArcBest</option>
                  <option value="freightos">Freightos</option>
                </select>
                <input #trackInput type="text" class="form-control input-xs" placeholder="Tracking #" style="width: 180px; display: inline-block;">
                <button class="btn btn-xs btn-primary" (click)="saveTracking(carrierSel.value, trackInput.value)" [disabled]="saving">Save</button>
              </div>
            </div>
          </div>

          <!-- 12. Delivered -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.delivered_at"
              [class.dot-waiting]="!project.delivered_at && project.tracking_number"
              [class.dot-pending]="!project.delivered_at && !project.tracking_number">
            </div>
            <div class="stage-body">
              <div class="stage-name">Delivered / Received</div>
              <div class="stage-date" *ngIf="project.delivered_at">{{ fmtMs(project.delivered_at) }}</div>
              <div class="stage-actions" *ngIf="!project.delivered_at && isAdmin">
                <button class="btn btn-xs btn-success" (click)="mark('delivered_at', true)" [disabled]="saving">Mark Delivered</button>
              </div>
            </div>
          </div>

          <!-- 13. Released to Deploy -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.release_status"
              [class.dot-waiting]="!project.release_status && project.delivered_at"
              [class.dot-pending]="!project.release_status && !project.delivered_at">
            </div>
            <div class="stage-body">
              <div class="stage-name">Released to Deploy</div>
              <div class="stage-date" *ngIf="project.released_at">Released {{ fmtMs(project.released_at) }}</div>
              <div class="stage-date text-muted" *ngIf="project.release_status && !project.released_at">Released</div>
              <div class="stage-actions" *ngIf="!project.release_status && isAdmin">
                <button class="btn btn-xs btn-success" (click)="releaseProject()" [disabled]="saving">
                  🚀 Release to Deploy App
                </button>
              </div>
            </div>
          </div>

          <!-- 12. Installation Complete -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.installation_confirmed_at"
              [class.dot-waiting]="!project.installation_confirmed_at && project.release_status"
              [class.dot-pending]="!project.installation_confirmed_at && !project.release_status">
            </div>
            <div class="stage-body">
              <div class="stage-name">Installation Complete</div>
              <div class="stage-date" *ngIf="project.installation_confirmed_at">Confirmed {{ fmtMs(project.installation_confirmed_at) }}</div>
              <div class="stage-date text-muted" *ngIf="!project.installation_confirmed_at && project.release_status">
                In progress — confirmed via Deploy App
              </div>
            </div>
          </div>

          <!-- 13. Install Invoice Sent (30%) -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.install_invoice_sent_at"
              [class.dot-waiting]="!project.install_invoice_sent_at && project.installation_confirmed_at"
              [class.dot-pending]="!project.install_invoice_sent_at && !project.installation_confirmed_at">
            </div>
            <div class="stage-body">
              <div class="stage-name">
                Install Invoice Sent <small class="text-muted">(30%)</small>
                <span class="waiting-badge" *ngIf="project.install_invoice_sent_at && !project.final_invoice_sent_at">Awaiting Payment</span>
              </div>
              <div class="stage-date" *ngIf="project.install_invoice_sent_at">Sent {{ fmtMs(project.install_invoice_sent_at) }}</div>
              <div class="stage-actions" *ngIf="!project.install_invoice_sent_at && isAdmin">
                <button class="btn btn-xs btn-primary" (click)="mark('install_invoice_sent_at', true)" [disabled]="saving">Mark Sent</button>
              </div>

            </div>
          </div>

          <!-- 14. EM&V Report Generated -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.emv_analysis_id"
              [class.dot-waiting]="!project.emv_analysis_id && project.install_invoice_sent_at"
              [class.dot-pending]="!project.emv_analysis_id && !project.install_invoice_sent_at">
            </div>
            <div class="stage-body">
              <div class="stage-name">EM&amp;V Report Generated</div>
              <div class="stage-date" *ngIf="project.emv_analysis_id">Generated — <a [routerLink]="['/project/emv-baseline']" (click)="selectProject()">View report →</a></div>
              <div class="stage-date text-muted" *ngIf="!project.emv_analysis_id">Generated on EM&amp;V Baseline page after installation</div>
            </div>
          </div>

          <!-- 15. Final Invoice Sent (40%) -->
          <div class="stage-row">
            <div class="stage-dot"
              [class.dot-done]="project.final_invoice_sent_at"
              [class.dot-waiting]="!project.final_invoice_sent_at && project.emv_analysis_id"
              [class.dot-pending]="!project.final_invoice_sent_at && !project.emv_analysis_id">
            </div>
            <div class="stage-body">
              <div class="stage-name">
                Final Invoice Sent <small class="text-muted">(40%)</small>
                <span class="waiting-badge" *ngIf="project.final_invoice_sent_at">Awaiting Payment</span>
              </div>
              <div class="stage-date" *ngIf="project.final_invoice_sent_at">Sent {{ fmtMs(project.final_invoice_sent_at) }}</div>
              <div class="stage-actions" *ngIf="!project.final_invoice_sent_at && isAdmin">
                <button class="btn btn-xs btn-primary" (click)="mark('final_invoice_sent_at', true)" [disabled]="saving">Mark Sent</button>
              </div>
            </div>
          </div>

        </div><!-- /pipeline stages -->

        <div *ngIf="saveError" class="alert alert-danger" style="margin-top: 16px;">{{ saveError }}</div>
        <div *ngIf="saveSuccess" class="alert alert-success" style="margin-top: 16px;">{{ saveSuccess }}</div>

      </div><!-- /project -->
    </div>
  `
})
export class PipelineDetailComponent implements OnInit {
  project: any = null;
  loading = true;
  saving  = false;
  saveError   = '';
  saveSuccess = '';

  get isAdmin() {
    const role = this.userService.user?.role;
    return role === 8 || role === 9 || role === 10;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
    private userService: CurrentUserService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get(`/api/pipeline/project/${id}`).subscribe(
      (res: any) => { this.project = Array.isArray(res) ? res[0] : (res.response || res); this.loading = false; },
      () => { this.loading = false; }
    );
  }

  fmtMs(ms: number): string {
    if (!ms) return '';
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private flash(msg: string, isError = false) {
    if (isError) { this.saveError = msg; setTimeout(() => this.saveError = '', 4000); }
    else         { this.saveSuccess = msg; setTimeout(() => this.saveSuccess = '', 3000); }
  }

  mark(field: string, value: any) {
    this.saving = true;
    this.api.post(`/api/pipeline/project/${this.project.id}/mark`, { field, value }).subscribe(
      () => { this.saving = false; this.reload(); this.flash('Saved.'); },
      (err: any) => { this.saving = false; this.flash('Error saving.', true); }
    );
  }

  savePO(po: string) {
    if (!po.trim()) { this.flash('Enter a PO number.', true); return; }
    this.saving = true;
    this.api.post(`/api/pipeline/project/${this.project.id}/mark`, { field: 'purchaseOrder', value: po.trim() }).subscribe(
      () => {
        this.api.post(`/api/pipeline/project/${this.project.id}/mark`, { field: 'po_received_at', value: true }).subscribe(
          () => { this.saving = false; this.reload(); this.flash('PO saved.'); },
          () => { this.saving = false; this.flash('Error saving PO date.', true); }
        );
      },
      () => { this.saving = false; this.flash('Error saving PO.', true); }
    );
  }

  saveTracking(carrier: string, number: string) {
    if (!number.trim()) { this.flash('Enter a tracking number.', true); return; }
    this.saving = true;
    this.api.post(`/api/pipeline/project/${this.project.id}/mark`, { field: 'carrier', value: carrier }).subscribe(
      () => {
        this.api.post(`/api/pipeline/project/${this.project.id}/mark`, { field: 'tracking_number', value: number.trim() }).subscribe(
          () => { this.saving = false; this.reload(); this.flash('Tracking saved.'); },
          () => { this.saving = false; this.flash('Error saving tracking number.', true); }
        );
      },
      () => { this.saving = false; }
    );
  }

  approveProposal() {
    if (!confirm('Mark this proposal as approved? This will notify Landon to generate the sales order.')) return;
    this.saving = true;
    this.api.post(`/api/pipeline/project/${this.project.id}/approve-proposal`, {}).subscribe(
      () => { this.saving = false; this.reload(); this.flash('Proposal approved — Landon notified.'); },
      () => { this.saving = false; this.flash('Error approving proposal.', true); }
    );
  }

  releaseProject() {
    if (!confirm('Release this project to the Deploy App? Crew will be able to see and work on this site.')) return;
    this.saving = true;
    this.api.post(`/api/pipeline/project/${this.project.id}/release`, {}).subscribe(
      () => { this.saving = false; this.reload(); this.flash('Project released to Deploy App!'); },
      () => { this.saving = false; this.flash('Error releasing project.', true); }
    );
  }

  selectProject() {
    if (this.project && this.userService.user) {
      const found = (this.userService.user.projects || []).find((p: any) => p.id === this.project.id);
      if (found) this.userService.selectProject(this.project.id);
    }
  }

  openEcbsDashboard() {
    if (this.project && this.userService.user) {
      const found = (this.userService.user.projects || []).find((p: any) => p.id == this.project.id);
      if (found) {
        this.userService.selectProject(this.project.id);
      }
      this.router.navigate(['/ecbs/dashboard']);
    }
  }

  private reload() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get(`/api/pipeline/project/${id}`).subscribe(
      (res: any) => { this.project = Array.isArray(res) ? res[0] : (res.response || res); }
    );
  }
}
