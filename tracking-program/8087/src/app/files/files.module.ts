import { NgModule } from '@angular/core'
import { SharedModule } from '../shared/shared.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SocketModule } from '../socket/socket.module'
import { CommonModule } from '@angular/common'
import { NgPipesModule } from 'angular-pipes'
import { FilesComponent } from './files.component'
import { CurrentUserService } from '../shared/user/currentUser.service'
import { FilesRoutingModule } from './files-routing.module'
import { HttpClientModule } from '@angular/common/http'
import { ListFilesComponent } from './list-files.component'
import {DataTableModule} from "primeng/primeng"
import {MomentModule} from "ngx-moment"
import { FilesService } from "./files.service";
import {PipesModule} from "../pipes/pipes.module";

import {
  CheckboxModule, ButtonModule, OverlayPanelModule, DropdownModule,
  ConfirmDialogModule, DialogModule, BlockUIModule, RadioButtonModule,
  InputMaskModule
} from 'primeng/primeng' 

@NgModule({ 
  imports: [
    FilesRoutingModule,
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    SocketModule,
    NgPipesModule,
    HttpClientModule,
    ButtonModule,
    CheckboxModule,
    OverlayPanelModule,
    DropdownModule,
    ConfirmDialogModule,
    DialogModule,
    BlockUIModule,
    InputMaskModule,
    RadioButtonModule,
    DataTableModule,
    MomentModule,
    PipesModule,
  ],
  declarations: [
    FilesComponent,
    ListFilesComponent,
  ],
  exports: [
    FilesComponent,
  ],
  providers: [
    FilesService,
  ]
})
export class FilesModule { }
