import {Component, OnInit} from '@angular/core';
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {Router, ActivatedRoute} from "@angular/router";
import {DeviceService} from "../../electricityMeters/devices/device.service";

@Component({
  selector: 'project-select',
  template: `
    <style>
      .disabled {
        position: relative;
      }
      .disabled::before {
        content: 'EXPIRED';
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: #e8e8e8c7;
        left: 0;
        top: 0;
        color: #00000026;
        font-weight: bold;
        vertical-align: middle;
        padding-top: 5em;
        font-size: 1.7em;
      }
    </style>
    <div class="container-fluid"> 
      <h3>Your Projects
      <p *ngIf="!userService.user.projects || userService.user.projects.length === 0" class="text-muted" style="margin-top: 8px;">
        No projects yet. Use <strong>New from bill</strong> to create one from an electric bill PDF, or <strong>Add new project</strong> to create manually.
      </p>
        <a class="btn btn-default pull-right" style="margin-left: 8px" *ngIf="userService.user.role === 7 || userService.user.role === 8" [routerLink]="['/project/create-from-bill']">New from bill</a>
        <a class="btn btn-primary pull-right" *ngIf="userService.user.role === 7 || userService.user.role === 8" [routerLink]="['/project/create']">Add new project</a>
      </h3>
      <div class="col-md-2" *ngFor="let project of userService.user.projects;">
        <div class="box text-center" style="height: 200px;" [class.disabled]="isExpired(project)">
          <h3 style="padding-top: -10px"><strong>{{project.name}}</strong></h3>
          <img *ngIf="project.logoImgSrc" width="120px" height="45px" src="/images/client_company_logo/{{project.client}}-client-logo"><br>
          <div style="padding-top: 10px">
            <a class="btn btn-sm btn-primary" *ngIf="userService.user.role === 8 || userService.user.role === 7" [routerLink]="['/project/edit', project.id]"><span class="button-icon ss-write"></span></a>&nbsp;
            <button class="default-button green-button" (click)="select(project)" [disabled]="isExpired(project)">Select</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProjectSelectComponent implements OnInit {

  constructor(
    private userService: CurrentUserService,
    private router: Router,
    private route: ActivatedRoute,
    private deviceService: DeviceService
  ) {
    userService.user.projects.forEach(function(project){
      let hasClient = window['BOOTSTRAP_DATA'].clients.find(client => { return client.id === project.client});
      if (hasClient) {
        project.logoImgSrc = hasClient.logoImgSrc;
      }
    });
  }

  ngOnInit() {
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    const go = this.route.snapshot.queryParamMap.get('go') || 'energy-savings';
    if (projectId && this.userService.user.projects) {
      const proj = this.userService.user.projects.find(p => String(p.id) === String(projectId));
      if (proj) {
        this.userService.selectProject(proj.id);
        const targetPath = go === 'emv-baseline' ? '/project/emv-baseline' : '/savings/' + go;
        this.router.navigate([targetPath], { replaceUrl: true });
        return;
      }
    }
  }

  select(project) {
    if(this.isExpired(project)) {
      return
    }
    this.userService.selectProject(project.id);
    this.router.navigate(['/savings/energy-savings']);
  }

  isExpired(project) {
    return false  
    /*return (
      this.userService.user.role <= 6
      && (
        !project.servicePlan
        || project.servicePlan.expiresAt < (new Date).getTime()
      )
    )*/
  }
}
