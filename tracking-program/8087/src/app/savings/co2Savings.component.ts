
import {timer as observableTimer, Observable} from 'rxjs';
import {Component, ViewChild} from '@angular/core';
import {Co2SavingsService} from "./co2Savings.service";
import {CurrentUserService} from "../shared/user/currentUser.service";
import {PdfLinkService} from "../shared/pdfLink.service";

@Component({
  selector: 'co2-savings',
  templateUrl: './co2Savings.component.html'
})
export class Co2SavingsComponent {

  @ViewChild('savingsChart', {static: false}) savingsChart;

  private breakdown;
  public links;
  public hasData = true;
  private chartData;
  public hasRunTest;
  private timer;
  private subscription;
  private chartTimer;
  private chartSubscription;

  constructor(private co2SavingsService: Co2SavingsService, private userService: CurrentUserService, private pdfLinkService: PdfLinkService) {}

  ngOnInit() {
    this.hasRunTest = this.userService.user.selectedProject.selectedTest;
    this.pdfLinkService.getLinks().subscribe(links => {
      this.links = links;
    });
    this.timer = observableTimer(5,60000);
    this.chartTimer = observableTimer(5,900000);
    this.chartSubscription = this.chartTimer.subscribe(lineChartData => {
      this.updateChart();
    });
    this.subscription = this.timer.subscribe(data => {
      this.refreshData();
    });
    
    
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.chartSubscription.unsubscribe();
  }

  getData(){
    this.co2SavingsService.getCarbonChart().subscribe(result => {
      this.chartData = result.chartData;
    });

  }

  updateChart() {
    this.co2SavingsService.getCarbonChart().subscribe(result => {
      this.chartData = result.chartData;
      this.savingsChart.setData([{data: this.chartData.carbonCurrent}, {data: this.chartData.carbonBefore}], this.chartData.chartLabel); 
    });
  }

  refreshData() {
    this.co2SavingsService.getCarbonSavings().subscribe(data => {
      this.breakdown = data.response;
    });
  }

}
