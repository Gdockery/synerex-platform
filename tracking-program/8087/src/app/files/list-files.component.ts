import { Component, OnInit, Inject, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { SavingsReportService } from "../billing/savingsReport/savingsReport.service";
import {ActivatedRoute, Router} from "@angular/router";
import { FilesService } from "./files.service";
import { ObjectHelpers } from "../shared/helpers/objectHelpers.service";
import { ApiHelpers } from "../shared/helpers/apiHelpers.service";
import { ConfirmationService } from "primeng/primeng";
import { FileUpload } from "primeng/components/fileupload/fileupload";
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {CurrentUserService} from "../shared/user/currentUser.service";
import { FileUploadModule } from 'primeng/components/fileupload/fileupload';


@Component({
  templateUrl: 'list-files.component.html',
})
export class ListFilesComponent implements OnInit {

  @ViewChild('table', {static: false}) table;
  @ViewChildren('uploaders') uploaders: QueryList<FileUpload>;
  public moment = require('moment');
  public savingsReports: any;
  private keys = Object.keys;
  public isSavingData;
  public fileName;
  public fileDescription;
  protected originalData;
  protected failedUploading = [];
  protected pdfSource: SafeResourceUrl;
  public selectedProject;
  /**
   * The bill analytic for the current project.
   */
  public files = null;

  protected recordCount = 0;

  public hasRunTest;

  public url = '/api/project/upload-file'

  public type;
  public tierHours;

  constructor(@Inject('ELECTRICITY_CHARGE_TYPES') private ELECTRICITY_CHARGE_TYPES, @Inject('TIER_HOURS') private TIER_HOURS, private apiHelpers: ApiHelpers, private confirmationService: ConfirmationService, private userService: CurrentUserService, private filesService: FilesService, private sanitizer: DomSanitizer, private route: ActivatedRoute) { 
    this.selectedProject = route.snapshot.queryParams['project'];
  }

  ngOnInit() {

  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refreshData(params) {
    if(!params.sortField) {
      params.sortField = 'createdAt';
      params.sortOrder = 1;
    }
    let requestParameters = this.apiHelpers.parsePaginationParams(params);
    this.filesService.getFiles(requestParameters).subscribe(data => {
      this.recordCount = data.meta.total;
      this.files = data.response;
    });
    
  }

  addFile() {
    if (!this.fileName) {

    } else {
      this.uploaders.toArray()[0].basicFileInput.nativeElement.click()
    }
    
  }

  uploadStarted() {
    console.log('uploadStarted')
  }
  
  uploadComplete() {
    console.log('uploadComplete')
    this.refreshTable();
  }

  uploadFailed() {
    console.log('uploadFailed');
  }

  confirmDelete(id, name) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this file? Once deleted it will not be recovered.',
      accept: () => {
        this.filesService.remove({fileName: name, fileId: id}).subscribe(result => {
          this.refreshTable();
        });
      }
    });
  }

  getFileUrl() {
      if (this.selectedProject) {
        return '/api/project/' + this.selectedProject + '/upload-file/' + this.fileName + '/' + this.fileDescription;
      } else {
        return '/api/project/upload-file/' + this.fileName + '/' + this.fileDescription;
      }
    }
}
