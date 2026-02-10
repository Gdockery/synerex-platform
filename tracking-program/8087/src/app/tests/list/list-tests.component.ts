///<reference path="../../shared/user/user.ts"/>
import {Component, ViewChild} from '@angular/core';
import {TestService} from "../tests.service";
import {ConfirmationService} from "primeng/primeng";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {AdminProjectService} from "../../admin/project/admin-project.service";

let _ = require('lodash');

@Component({
  selector: 'list-tests',
  templateUrl: 'list-tests.component.html'
})
export class ListTestsComponent {

  @ViewChild('table', {static: false}) table;

  protected tests;
  public recordCount = 0;
  public perPage = 10;
  public showCancelled = false;
  public showDeleteOption = true;
  public gwControl = false;
  public projectSelectedTest;
  

  constructor(private testService: TestService,
              private confirmationService: ConfirmationService,
              private userService: CurrentUserService,
              private projectService: AdminProjectService) {}

  ngOnInit() {
    this.showDeleteOption = _.includes([8], this.userService.user.role);
    this.gwControl = this.userService.user.selectedProject.gwControl;
    this.getProjectSelectedTest();
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    if(!params.filters.showCancelled) {
      params.filters.showCancelled = {value:false};
    }
    this.testService.getPaginated(params).subscribe(responseData =>{
      this.recordCount = responseData.meta.total;
      this.tests = _.map(responseData.response, function(test) {
        test.gatewayNames = _.map(test.gateways, function(gateway) {
          return gateway.name;
        }).join(', ');

        return test;
      });
    });
  }

  getProjectSelectedTest() {
    this.projectService.get(this.userService.user.selectedProject.id).subscribe(data => {
     this.projectSelectedTest = data.response.selectedTest;
    }); 
  }

  confirmDelete(id) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this test?',
      accept: () => {
        this.testService.remove(id).subscribe(result => {
          if (this.userService.user.selectedProject.selectedTest == id) {
            this.projectService.update(this.userService.user.selectedProject.id, {valuesToSet:{
               kvaSavings: 0,
               kvarSavings: 0,
               kwPeakSavings: 0,
               kwhSavings: 0,
               pfSavings: 0,
               selectedTest: null,
             }}).subscribe(response => {}); 
             this.userService.user.selectedProject.selectedTest = null;
          }
          this.refreshTable();
        })
      }
    });
  }
}
