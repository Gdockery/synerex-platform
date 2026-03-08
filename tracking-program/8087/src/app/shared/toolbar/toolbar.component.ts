import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute} from "@angular/router";
import {Title} from "@angular/platform-browser";
import {CurrentUserService} from "../user/currentUser.service";
import {ApiRequestService} from "../../api/api-request.service";
import {WhitelabelService} from "../services/whitelabel.service";

@Component({
  selector: 'sd-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit{

  private client;
  private project;
  public selectedClientId;
  public logoPath;
  public daysLeftInSub;
  public colorOfSub;

  constructor(private userService: CurrentUserService, private route: ActivatedRoute, private apiService: ApiRequestService, private whitelabelService: WhitelabelService) {
    this.selectedClientId = route.snapshot.params['id'];
  }

  ngOnInit() {
    if (this.userService.user && this.userService.user.client && this.userService.user.client.id) {
      this.logoPath = this.whitelabelService.getClientLogoUrl(this.userService.user.client.id);
    }
    this.client = {};
    this.project = {};
    this.fetch();
    
    /*if (this.user.selectedProject) {
      if (this.project.subNeeded) {
        var date1 = new Date(this.project.subStartDate);
        var date2 = new Date();

        console.log (date1);
        console.log (date2);

        // To calculate the time difference of two dates 
        var Difference_In_Time = date2.getTime() - date1.getTime(); 
          
        // To calculate the no. of days between two dates 
        this.daysLeftInSub = Difference_In_Time / (1000 * 3600 * 24); 

        console.log (this.daysLeftInSub);
        if (this.daysLeftInSub < 30) {
          this.colorOfSub = "red";
        } else {
          this.colorOfSub = "black";
        }
        console.log (this.colorOfSub);
      }
    }*/
    
  }

  fetch() {
    if (!this.userService.user || !this.userService.user.client || !this.userService.user.client.id) {
      return;
    }

    this.apiService.get('/api/client/' + this.userService.user.client.id).subscribe(responseData =>{
      this.client = responseData.response; 
    });
  }

}

