import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-admin',
  template: `
    <div class="admin-layout">

      <!-- Admin sidebar -->
      <nav class="admin-sidebar">
        <div class="admin-sidebar-header">
          <span class="fa fa-shield"></span>
          <span>ADMINISTRATION</span>
        </div>

        <div class="admin-nav-section">ENGINEERING</div>
        <a class="admin-nav-link" routerLink="/synerex-administrator/digital-twin-editor" routerLinkActive="active">
          <span class="fa fa-share-alt"></span> Digital Twin Editor
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/project/list" routerLinkActive="active">
          <span class="fa fa-building-o"></span> Sites &amp; Projects
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/client/list" routerLinkActive="active">
          <span class="fa fa-briefcase"></span> Clients
        </a>

        <div class="admin-nav-section">USER MANAGEMENT</div>
        <a class="admin-nav-link" routerLink="/synerex-administrator/user/list" routerLinkActive="active">
          <span class="fa fa-users"></span> Users &amp; Roles
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/oem" routerLinkActive="active">
          <span class="fa fa-sitemap"></span> OEM Partners
        </a>

        <div class="admin-nav-section">PLATFORM</div>
        <a class="admin-nav-link" routerLink="/synerex-administrator/branding" routerLinkActive="active">
          <span class="fa fa-paint-brush"></span> White-Label Branding
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/advanced" routerLinkActive="active">
          <span class="fa fa-sliders"></span> Advanced Options
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/audit-log" routerLinkActive="active">
          <span class="fa fa-history"></span> Audit Log
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/data-export" routerLinkActive="active">
          <span class="fa fa-download"></span> Data Export
        </a>
        <a class="admin-nav-link" routerLink="/synerex-administrator/subscription" routerLinkActive="active">
          <span class="fa fa-credit-card"></span> Subscription
        </a>

        <div class="admin-sidebar-footer">
          <a class="admin-back-link" routerLink="/ecbs/dashboard">
            <span class="fa fa-arrow-left"></span> Back to Portal
          </a>
        </div>
      </nav>

      <!-- Content area -->
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>

    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      height: 100%;
      background: #070d18;
      overflow: hidden;
    }
    .admin-sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #0a1526;
      border-right: 1px solid #1a2a3a;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 0 0 16px 0;
    }
    .admin-sidebar-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #e8edf5;
      border-bottom: 1px solid #1a2a3a;
      margin-bottom: 8px;
    }
    .admin-sidebar-header .fa { color: #00e676; font-size: 14px; }
    .admin-nav-section {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #546e7a;
      padding: 12px 16px 4px;
    }
    .admin-nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      font-size: 12px;
      color: #8899a6;
      text-decoration: none;
      border-left: 2px solid transparent;
      transition: all 0.15s;
    }
    .admin-nav-link:hover { background: #111927; color: #e8edf5; }
    .admin-nav-link.active { background: rgba(0,230,118,0.08); color: #00e676; border-left-color: #00e676; }
    .admin-nav-link .fa { width: 16px; text-align: center; }
    .admin-sidebar-footer {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid #1a2a3a;
    }
    .admin-back-link {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #546e7a;
      text-decoration: none;
      transition: color 0.15s;
    }
    .admin-back-link:hover { color: #e8edf5; }
    .admin-content {
      flex: 1;
      overflow-y: auto;
      background: #070d18;
    }
  `]
})
export class AdminComponent {
  constructor(private router: Router) {}
}
