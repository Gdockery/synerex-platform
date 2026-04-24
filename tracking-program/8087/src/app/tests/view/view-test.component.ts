import {Component, OnInit} from '@angular/core';
import {TestService} from "../tests.service";
import {ActivatedRoute} from "@angular/router";
import {AdminProjectService} from "../../admin/project/admin-project.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";
import {PdfLinkService} from "../../shared/pdfLink.service";

@Component({
  selector: 'view-test',
  templateUrl: './view-test.component.html'
})
export class ViewTestComponent implements OnInit {
  protected testData;
  protected totals;
  protected id;
  private meters = [];
  private selectMeterError = false;
  private allSelected = false;
  public links;
  public minutesToAverage: number = 5; // Default to 5 minutes
  public minutesToIgnore: number = 1; // Default to 1 minute (ignores last minute of off and first minute of on)
 
  constructor(private testService: TestService, private currentUserService: CurrentUserService, private route: ActivatedRoute, private projectService: AdminProjectService, private deviceService: DeviceService, private pdfLinkService: PdfLinkService) {}

  ngOnInit() {
    //get meters for project
    this.meters = this.currentUserService.user.selectedProject.meters;
    this.getReportingMeters();
    this.refreshTestResults();
  }

  refreshTestResults() {
   if (this.getSelected().length == 0) {
     this.selectMeterError = true;
   } else {
     this.selectMeterError = false;
     this.route.params.subscribe(params => {
     this.id = +params['id'];
     this.pdfLinkService.getLinks({test: this.id, meters: this.getSelected()}).subscribe(links => {
      this.links = links;
    });
      this.testService.getTestDataOfSelectedMeters(+params['id'], this.getSelected().toString(), this.minutesToAverage, this.minutesToIgnore).subscribe(data => {
         this.testData = data.response;
      });
      });
   }
  }  

  getReportingMeters() {
    this.meters.forEach(function(meter) {
      if (meter.isReporting == 1) {
        meter.checked = true;
      }
    });
    if (this.getSelected().length === this.meters.length) {
      this.allSelected = true;
    }
  }
  
  selectAllMeters() {
    this.meters.forEach(function(meter) {
      meter.checked = true;
    });
    this.allSelected = true;
  }  
 
 select() {
   if (this.getSelected().length < this.meters.length) {
    this.meters.forEach(function(meter) {
      meter.checked = true;
    });
    this.allSelected = true;
   } else {
    this.meters.forEach(function(meter) {
      meter.checked = false;
    });
    this.allSelected = false;
   }
   this.refreshTestResults();
 }  

 getSelected() {
   let result = this.meters.filter((meter) => { return meter.checked == true})
                    .map((meter) => { return meter.id});
   return result;   
 }  

 changeCheckbox(i) {
   this.meters[i].checked = !this.meters[i].checked;
   if (this.getSelected().length != this.meters.length) {
    this.allSelected = false;
   } else {
    this.allSelected = true;
   }
   this.refreshTestResults();
  }  

 //update database first then currently selected project
 updateSavings() {
   this.projectService.update(this.currentUserService.user.selectedProject.id, {valuesToSet:{
     kvaSavings: this.testData.percentSaved.kva,
     kvarSavings: this.testData.percentSaved.kvar,
     kwPeakSavings: this.testData.percentSaved.kwPeak,
     kwhSavings: this.testData.percentSaved.kwh,
     pfSavings: this.testData.percentSaved.powerFactor,
     selectedTest: this.id,
   }}).subscribe(response => {
     this.testData.percentSaved.kwp = this.testData.percentSaved.kwPeak;
     this.currentUserService.updateProjectSavings(this.id, this.testData.percentSaved);
     this.currentUserService.user.selectedProject.hasRunTest = true;
     this.currentUserService.user.selectedProject.selectedTest = this.id;
   });  
  }

  updateReportingMeters() {
    console.log("updating reporting meters");
    let reportingMeters = this.getSelected();
    this.testService.updateReportingMeters(this.currentUserService.user.selectedProject.id, reportingMeters).subscribe(data => {});
  }

}
