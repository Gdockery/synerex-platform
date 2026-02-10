import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PaymentComponent } from './payment.component'
import { WelcomePaymentComponent } from './welcome-payment.component'

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: PaymentComponent, data: {title: 'Payment'}, children: [
        { path: '', redirectTo:'welcome', pathMatch: 'full'},
        { path: 'welcome', component: WelcomePaymentComponent, data: {title: 'Payment'}}
      ]}
    ])
  ],
  exports: [RouterModule]
})
export class PaymentRoutingModule { }
