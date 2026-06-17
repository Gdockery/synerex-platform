import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CurrentUserService } from '../user/currentUser.service';
import { ApiRequestService } from '../../api/api-request.service';
import { WhitelabelService } from '../services/whitelabel.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

const ROLE_LABELS: { [k: number]: string } = {
  1:  'Client User',
  2:  'Client Admin',
  3:  'Client Manager',
  4:  'Client Finance',
  5:  'Engineering',
  6:  'Operations',
  7:  'Account Manager',
  8:  'Administrator',
  9:  'OEM Admin',
  10: 'OEM User',
  11: 'Installer',
  12: 'Executive',
  13: 'Read Only',
};

@Component({
  selector: 'sd-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnDestroy {

  public selectedClientId: string;
  public logoPath: string;
  public logoFailed = false;

  /** ECBS header extras */
  public pageTitle   = '';
  public dateRangeLabel = '';
  public roleLabel   = '';

  private client: any = {};
  private routerSub: Subscription;

  constructor(
    public userService: CurrentUserService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiRequestService,
    private whitelabelService: WhitelabelService,
  ) {
    this.selectedClientId = route.snapshot.params['id'];
  }

  ngOnInit() {
    if (this.userService.user?.client?.id) {
      this.logoPath = this.whitelabelService.getClientLogoUrl(this.userService.user.client.id);
    }
    this.fetch();
    this._updateMeta();

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this._updateMeta());
  }

  ngOnDestroy() {
    if (this.routerSub) { this.routerSub.unsubscribe(); }
  }

  private _updateMeta() {
    const role = Number(this.userService.user?.role);
    this.roleLabel = ROLE_LABELS[role] || '';

    const url = this.router.url;
    this.pageTitle = this._titleFromUrl(url);

    // Dynamic date range: last 7 days default
    const now  = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.dateRangeLabel = this._fmt(from) + ' – ' + this._fmt(now);
  }

  private _titleFromUrl(url: string): string {
    if (url.includes('/ecbs/dashboard'))         return 'Enterprise Dashboard';
    if (url.includes('/ecbs/capacity'))          return 'Capacity Intelligence';
    if (url.includes('/ecbs/digital-twin'))      return 'Digital Twin';
    if (url.includes('/ecbs/sites'))             return 'Sites';
    if (url.includes('/ecbs/transformers'))      return 'Transformers';
    if (url.includes('/ecbs/electrical-network')) return 'Electrical Network';
    if (url.includes('/ecbs/current-analysis'))  return 'Current Analysis';
    if (url.includes('/ecbs/savings'))           return 'Savings & Financials';
    if (url.includes('/ecbs/alarms'))            return 'Alarms & Events';
    if (url.includes('/ecbs/reports'))           return 'Reports';
    if (url.includes('/ecbs/devices'))           return 'Devices';
    if (url.includes('/ecbs/settings'))          return 'Settings';
    return '';
  }

  private _fmt(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  fetch() {
    if (!this.userService.user?.client?.id) { return; }
    this.apiService.get('/api/client/' + this.userService.user.client.id).subscribe((data: any) => {
      this.client = data.response;
    });
  }
}
