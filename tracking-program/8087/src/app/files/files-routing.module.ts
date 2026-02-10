import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { FilesComponent } from './files.component'
import { ListFilesComponent } from './list-files.component'
import { FileUploadModule } from 'primeng/components/fileupload/fileupload';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: FilesComponent, data: {title: 'Files'}, children: [
        { path: 'files', children: [
          { path: 'list', component: ListFilesComponent, data: {title: 'Admin Files List'}},
          { path: 'list/:project', component: ListFilesComponent, data: {title: 'Admin Files List'}},
        ]},
        { path: '**', redirectTo:'files/admin-files/list' }
      ]}
    ]),  
    FileUploadModule
  ],
  exports: [RouterModule, FileUploadModule]
})
export class FilesRoutingModule { }
