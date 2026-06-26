import {Component, Inject, OnInit, ViewContainerRef, ViewEncapsulation, ViewChild} from '@angular/core';
import {CurrentUserService} from "./shared/user/currentUser.service";
import {RouterTitleService} from "./shared/routerTitle.service";
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router} from "@angular/router";
import {NgProgressComponent} from "ngx-progressbar";
import {GlobalNotificationService} from "./shared/globalNotification.service";
import {WhitelabelService} from "./shared/services/whitelabel.service";
import {APP_CONFIG, IAppConfig} from "./config/app.config";

@Component({
  selector: 'sd-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

	public _opened: boolean = true;
	public brandName: string = 'Synerex';
	public lastUpdated: string = '';
	public isFieldMode: boolean = false;

	private _refreshTimer: any;
	
	@ViewChild(NgProgressComponent, {static: false}) progressIndicator: NgProgressComponent;

  constructor(
    private userService: CurrentUserService,
    vcr: ViewContainerRef, routerTitleService: RouterTitleService,
    private router: Router,
    public globalNotificationService: GlobalNotificationService,
    private whitelabelService: WhitelabelService,
    @Inject(APP_CONFIG) private config: IAppConfig
  ) {
    router.events.subscribe((event) => {
      this.navigationInterceptor(event);
    });
  }

  public ngOnInit() {
    const role = Number((this.config.locals && this.config.locals.user && this.config.locals.user.role) || 0);
    this.isFieldMode = (role === 14);
    if (this.isFieldMode || window.innerWidth < 600) {
      this._opened = false;
    }

    // Hide the platform sidebar on all /ecbs/ routes (they have their own nav)
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const onEcbs = /\/ecbs\//.test(event.urlAfterRedirects);
        if (onEcbs) {
          this.isFieldMode = true;
          this._opened = false;
        } else if (role !== 14) {
          this.isFieldMode = false;
        }
      }
    });
    this.globalNotificationService.subscribe();
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    this._updateTimestamp();
    this._refreshTimer = setInterval(() => this._updateTimestamp(), 60000);
  }

  private _updateTimestamp() {
    this.lastUpdated = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }

  public _toggleSidebar() {
    this._opened = !this._opened;
  }

  // Shows and hides the loading spinner during RouterEvent changes
  navigationInterceptor(event): void {
    if (event instanceof NavigationStart) {
      if (this.progressIndicator) {
        this.progressIndicator.start();
      }
    }
    if (event instanceof NavigationEnd) {
      if (this.progressIndicator) {
        this.progressIndicator.complete();
      }
    }

    // Set loading state to false in both of the below events to hide the spinner in case a request fails
    if (event instanceof NavigationCancel) {
      if (this.progressIndicator) {
        this.progressIndicator.complete();
      }
    }
    if (event instanceof NavigationError) {
      if (this.progressIndicator) {
        this.progressIndicator.complete();
      }
    }
  }
}
