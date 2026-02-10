import { Component, OnInit, NgZone, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder } from "@angular/forms";
import {ApiRequestService} from "../../api/api-request.service";
import { FileUpload } from "primeng/components/fileupload/fileupload";

var _ = require('lodash');

var VALIDATIONS = require('./client.validations').default;


@Component({
  templateUrl: 'edit-client.component.html'
})
export class ClientEditComponent implements OnInit {

  public selectedClientId;
  private syncingFormData = false;
  private syncingSubmit = false;
  private archivingClient = false;
  private form;
  private client;
  private logoPath;
  private url;
  private selectedFile : File;
  private imagePreview: string;
  @ViewChildren('uploaders') uploaders: QueryList<FileUpload>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private apiService: ApiRequestService
  ) {
    this.selectedClientId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.client = {};
    var hydratedValidations = _.cloneDeep(VALIDATIONS);
    _.each(hydratedValidations, (def, fieldName)=>{
      def[0].disabled = this.syncingSubmit || this.archivingClient || this.client.isDeleted;
    });
    this.form = this.formBuilder.group(hydratedValidations);

    this.fetch();

  }

  onFileUpload(event){
    let userFile = event[0];
    let fileExtension = '' + userFile.name.split('.')[1];
    this.selectedFile = new File([userFile], '-client-logo' + '.' + fileExtension, {type: userFile.type});
    console.log("logo", this.selectedFile);
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
   /* this.http.post('/api/client/' + clientId + '/upload-logo', {logo: this.selectedFile}).subscribe(response => {
        console.log("file uploaded");
    });*/
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

  fetch() {
    this.syncingFormData = true;
    this.apiService.get('/api/client/'+this.selectedClientId).subscribe(responseData =>{
      this.syncingFormData = false;
      this.client = responseData.response;
      this.logoPath = '/images/client_company_logo/' + this.client.name + '-logo';
      this.form.patchValue(this.client);
      this.url = '/api/client/' + this.selectedClientId + '/upload-logo';
    });
  }

  submitEditClientForm() {
    if(this.syncingSubmit || this.archivingClient || this.client.isDeleted) { return; }

    this.syncingSubmit = true;
    this.apiService.put('/api/client/'+this.selectedClientId, {
      valuesToSet: this.form.value
    }).subscribe(responseData =>{
      this.syncingSubmit = false;
      this.router.navigate(['/xeco-administrator/client/list']);
    });
  }

  clickDeleteClientButton() {
    if(window.confirm('Are you sure you want to archive this client?')) {
      this.archivingClient = true;
      this.apiService.delete('/api/client/'+this.selectedClientId).subscribe(responseData => {
        this.archivingClient = false;
        this.router.navigate(['/xeco-administrator/client/list']);
      });
    }
  }

}
