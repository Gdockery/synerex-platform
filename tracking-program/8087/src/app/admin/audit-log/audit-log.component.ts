import { Component } from '@angular/core';

@Component({
  selector: 'admin-audit-log',
  template: `
    <div class="admin-page">
      <div class="admin-page-header">
        <span class="fa fa-history"></span>
        <div>
          <div class="admin-page-title">Audit Log</div>
          <div class="admin-page-sub">Full system audit trail — every action logged</div>
        </div>
      </div>
      <div class="admin-placeholder">
        <span class="fa fa-history admin-ph-icon"></span>
        <div class="admin-ph-title">Audit Log</div>
        <div class="admin-ph-sub">All admin and user actions are recorded here. Coming soon.</div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding: 24px; }
    .admin-page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
    .admin-page-header .fa { font-size: 22px; color: #00e676; }
    .admin-page-title { font-size: 18px; font-weight: 700; color: #e8edf5; }
    .admin-page-sub { font-size: 12px; color: #546e7a; }
    .admin-placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 60px; border: 1px solid #1a2a3a; border-radius: 8px;
      background: #0a1526; color: #546e7a; text-align: center;
    }
    .admin-ph-icon { font-size: 44px; color: #1a2a3a; }
    .admin-ph-title { font-size: 16px; color: #8899a6; }
    .admin-ph-sub { font-size: 12px; }
  `]
})
export class AuditLogComponent {}
