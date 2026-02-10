import { Component } from '@angular/core';

import { CurrentUserService } from "../shared/user/currentUser.service";
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './maintenance.component.html'
})


export class MaintenanceComponent {

  public remoteIp = ''
  public remotePort = ''
  public remoteSecret = ''
  public localStatus = {}
  public remoteStatus = {}
  public status = 'disconnected'
  public actionsDisabled = false
  public updateStatus = undefined
  public errorMessage = undefined
  public statusError = undefined


  constructor(private currentUserService: CurrentUserService, private http: HttpClient) { }

  ngOnInit() {
    this.currentUserService.deselectProject();
  }

  connect() {
    this.status = 'connecting'
    this.errorMessage = undefined
    this.keepGettingStatus()
  }

  disconnect() {
    this.status = 'disconnected'
  }

  keepGettingStatus() {
    this.http.post('/api/maintenance/remote-status', {
      host: this.remoteIp + ':' + this.remotePort,
      secret: this.remoteSecret
    })
      .subscribe(data => {

        let details = data//.json() ??

        if (!details
          || details['remote']['status'] == 'Forbidden'
          || !details['remote']['status']['name']
        ) {

          this.errorMessage = "Remote host refused the connection"
          if (details && details['remote']['status']) {
            this.errorMessage += ': ' + details['remote']['status']
          }

          this.status = 'disconnected'

        } else {

          if(this.status != 'disconnected') this.status = 'connected'

          let remote = details['remote']

          this.localStatus = details['local']
          this.remoteStatus = remote['status']

          this.actionsDisabled = remote['updateStatus'] == 'in progress'
            || (this.remoteStatus['state'] != 'Ready'
              && this.remoteStatus['state'] != 'Error')

          this.updateStatus = remote['updateStatus']
          this.statusError = remote['error']

          if(this.localStatus['nodeVersion'] != this.remoteStatus['nodeVersion']) {
            this.actionsDisabled = true
            this.statusError = "Incompatible nodejs versions: (local " + this.localStatus['nodeVersion'] + ") (remote " + this.remoteStatus['nodeVersion'] + ")"
          }

        }

        if (this.status == 'disconnected') return

        setTimeout(() => {
          this.keepGettingStatus()
        }, 1500)
      },

        error => {

          this.errorMessage = error.toString()
          this.status = 'disconnected'

        })
  }

  update() {
    this.http.post('/api/maintenance/remote-update', {
      host: this.remoteIp + ':' + this.remotePort,
      secret: this.remoteSecret
    })
      .subscribe(data => {

      })
  }

  rollback() {
    this.http.post('/api/maintenance/remote-rollback', {
      host: this.remoteIp + ':' + this.remotePort,
      secret: this.remoteSecret
    })
      .subscribe(data => {

      })
  }


}
