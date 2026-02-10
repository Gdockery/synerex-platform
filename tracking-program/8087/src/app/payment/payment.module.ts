import { NgModule } from '@angular/core'
import { SharedModule } from '../shared/shared.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SocketModule } from '../socket/socket.module'
import { CommonModule } from '@angular/common'
import { NgPipesModule } from 'angular-pipes'
import { PaymentComponent } from './payment.component'
import { CurrentUserService } from '../shared/user/currentUser.service'
import { PaymentService } from './payment.service'
import { WelcomePaymentComponent } from './welcome-payment.component'
import { PaymentRoutingModule } from './payment-routing.module'
import { HttpClientModule } from '@angular/common/http';
import {
  CheckboxModule, ButtonModule, OverlayPanelModule, DropdownModule,
  ConfirmDialogModule, DialogModule, BlockUIModule, RadioButtonModule,
  InputMaskModule
} from 'primeng/primeng'

@NgModule({
  imports: [
    PaymentRoutingModule,
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
    RadioButtonModule
  ],
  declarations: [
    PaymentComponent,
    WelcomePaymentComponent
  ],
  exports: [
    PaymentComponent,
    WelcomePaymentComponent
  ],
  providers: [
    PaymentService
  ]
})
export class PaymentModule { }
