import { Component, OnInit, NgZone, ViewChild, ViewChildren, QueryList} from '@angular/core';
import { Router } from "@angular/router";
import { FormBuilder } from "@angular/forms";
import {ApiRequestService} from "../../api/api-request.service";
import { FileUpload } from "primeng/components/fileupload/fileupload";
import {HttpClient} from '@angular/common/http';
import { CurrentUserService } from '../../shared/user/currentUser.service';

var _ = require('lodash');

var VALIDATIONS = require('./client.validations').default;


@Component({
  templateUrl: 'create-client.component.html'
})
export class ClientCreateComponent implements OnInit {
  private clientCreated = false;
  private syncingSubmit = false;
  private form;
  private newClient;
  private selectedFile : File;
  private imagePreview: string;
  @ViewChildren('uploaders') uploaders: QueryList<FileUpload>;
  protected inProgress = [];
  protected failedUploading = [];
  private url;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private apiRequest: ApiRequestService,
    private http: HttpClient,
    private currentUserService: CurrentUserService,
  ) {}

  ngOnInit() {
    var hydratedValidations = _.cloneDeep(VALIDATIONS);
    _.each(hydratedValidations, (def, fieldName)=>{
      def[0].disabled = this.syncingSubmit;
    });
    this.form = this.formBuilder.group(hydratedValidations);
  }


  onFileUpload(event){
    let userFile = event[0];
    let fileExtension = '' + userFile.name.split('.')[1];
    this.selectedFile = new File([userFile], '-client-logo' + '.' + fileExtension, {type: userFile.type});
    const reader = new FileReader();
    reader.onload = () => {
    this.imagePreview = reader.result.toString();
    };
    reader.readAsDataURL(this.selectedFile);
  } 

  addLogo() {
    this.uploaders.toArray()[0].basicFileInput.nativeElement.click()
  }

  uploadFile(clientId) {
    //Upload file here send a binary data
    this.http.post('/api/client/' + clientId + '/upload-logo', {logo: this.selectedFile}).subscribe(response => {
        console.log("file uploaded");
    });
  }

  uploadStarted() {
    console.log('uploadStarted')
  }
  
  uploadComplete() {
    console.log('uploadComplete')
  }

  uploadFailed() {
    console.log('uploadFailed');
  }

  submitCreateClientForm() {
    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if(!this.form.valid) { return; }

    var formData = this.form.value;
    formData.createdBy = this.currentUserService.user.id;

    this.syncingSubmit = true;

    this.apiRequest.post('/api/client', {
      valuesToSet: formData
    }).subscribe(meta => {
      this.syncingSubmit = false;
      this.newClient = formData;
      this.clientCreated = true;
      window['SAILS_LOCALS'].clients.push({id: meta.response.id, name: this.newClient.name, createdBy: this.newClient.createdBy});
      this.url = '/api/client/' + meta.response.id + '/upload-logo';
    });
  }

}
