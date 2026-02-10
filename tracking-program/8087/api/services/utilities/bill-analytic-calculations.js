module.exports = {
  calculate: function(project) {
    let savings = {
      amp: .4,
      kw: 487/1000
    };

    //Sample project data.
    // project = {
    //   electricBillAnalysis: {
    //     billAmount: 61556.02, //Client Input B55 | Bill Analytic B225
    //     totalKwh: 325007,//Client input: C56 | Bill Analytic B226, G249
    //     daysBilled: 32, // Client Input E56
    //     kwPeak: 695, // Client Input H60,
    //     kwRatePerTariff: 18.74,// Client Input F58 | Bill Analytic F228
    //     recommendedReserveAdjustment: .15,//Bill Analytic E322
    //     totalSavings: 6218.46 
    //   }
    // };

    let data = {};
   
    project.electricBillAnalysis.totalKwh = project.electricBillAnalysis.totalKwh * (project.reportFields.effectivePercent ? (project.reportFields.effectivePercent / 100) : (100 / 100));
    data.recommendedCalculatedReservePercentAsFraction = 15 / 100; //project.reportFields.recommendedReserveAdjustment / 100;
    data.billingHours = project.electricBillAnalysis.daysBilled * 24;//Client input: F5
    
    data.volts = project.electricBillAnalysis.voltage ? project.electricBillAnalysis.voltage : 476; //placeholder until we get every project having voltage set
    data.ampDraw = parseFloat(project.electricBillAnalysis.totalKwh) /  (data.billingHours ? data.billingHours : 720);
    console.log('data.ampDraw mid', data.ampDraw);

    data.ampDraw = parseFloat(data.ampDraw) * 1000 / data.volts;//Client input: G56 | Bill Analytic G251
    
    /*console.log('totalKwh:', parseFloat(project.electricBillAnalysis.totalKwh));
    console.log('billingHours:', data.billingHours);
    console.log('volts:', data.volts);
    console.log('data.ampDraw', data.ampDraw);
    */
    data.kvar = (data.ampDraw * data.volts) / 1000; //Client Input M53

    data.kw15MinuteInterval = parseFloat(project.electricBillAnalysis.totalKwh) / (24 * project.electricBillAnalysis.daysBilled);
    data.pfEquation = data.kw15MinuteInterval / parseFloat(project.electricBillAnalysis.kwPeak); //Client Input K51
    data.minus = 1;//Client Input L51 @todo: Not sure where this comes from
    data.kvarPercent = (data.pfEquation - 1) * -1; //Client Input M51
    data.kwInKvar = data.kvar * data.kvarPercent; //Client Input N53
    data.actualKw = data.kvar + data.kwInKvar; //Client Input P53
  
    data.demandSidePowerFactor = data.pfEquation;//data.actualKw / parseFloat(project.electricBillAnalysis.kwPeak); // Client Input H50 | Bill Analytic G252
    data.demandSideReactiveEnergy = 1 - data.demandSidePowerFactor; //Client Input T54 | Bill Analytic G253
    data.kwKwhSupplyRatio = data.kw15MinuteInterval / parseFloat(project.electricBillAnalysis.kwPeak); //Client Input G50
    data.baselineKwh = parseFloat(project.electricBillAnalysis.totalKwh) * data.kwKwhSupplyRatio; //Client Input D57 | Bill Analytic B229
    data.demandKwh = parseFloat(project.electricBillAnalysis.totalKwh) * (1 - data.kwKwhSupplyRatio); //Client Input D58 | Bill Analytic B231

    //Bill Analytic
    // (See Below) data.combinedKwhRate = parseFloat(project.electricBillAnalysis.billAmount) / parseFloat(project.electricBillAnalysis.totalKwh);// Bill Analytic B227
    data.reactiveKvarSupplyWaste = 1 - data.demandSidePowerFactor;// data.ampDraw * data.demandSideReactiveEnergy; //Bill Analytic G254
    data.ampSavings = data.demandSideReactiveEnergy * data.ampDraw * savings.amp; // Bill Analytic G256
    //console.log('data.demandSideReactiveEnergy', data.demandSideReactiveEnergy);
    //console.log('data.ampDraw', data.ampDraw);
    //console.log('savings.amp', savings.amp);
    data.calculatedKwSavings = data.ampSavings * data.volts / 1000 ; // savings.kw; // Bill Analytic G257
    data.calculatedKwhSavings = data.calculatedKwSavings * 23 * 29; // Bill Analytic G258
    data.baselineDemand = data.demandKwh / parseFloat(project.electricBillAnalysis.totalKwh); //Bill Analytic E290
   
    data.co2Reduction = data.calculatedKwhSavings * 0.00070868248;

    //total kwh charge is just the sum of all line item kwh charge
    data.combinedKwhRate = project.electricBillAnalysis.lineItems.reduce((sum, item) => {
	console.log("lineitem: " , item);
	if (item.type == 'kwh') 
          return sum += parseFloat(item.billingRate);
	else
	  return sum;
      }, 0);
    data.totalOverageCost = data.combinedKwhRate * data.demandKwh;//data.demandKwh / data.billingHours * parseFloat(project.electricBillAnalysis.kwRatePerTariff);

    data.totalCharges = project.electricBillAnalysis.lineItems.reduce((sum, item) => {
        return sum += parseFloat(item.cost)
      }, 0) + parseFloat(project.electricBillAnalysis.customerCharge); //D190


    data.afterXecoKwUsage = data.kw15MinuteInterval - data.calculatedKwSavings; //Bill Analytic D327
    data.newKwSupplyReserve = data.afterXecoKwUsage * (1 + data.recommendedCalculatedReservePercentAsFraction);//Bill Analytic E327
    
    data.montlyKwSavings = parseFloat(project.electricBillAnalysis.kwPeak) - data.newKwSupplyReserve;//Bill Analytic F327
    data.rateKwAfter = data.montlyKwSavings * parseFloat(project.electricBillAnalysis.kwRatePerTariff);

    //Supply side reserve calculations
    data.currentUnusedKwOversupply = parseFloat(project.electricBillAnalysis.kwPeak) - data.kw15MinuteInterval; //Bill Analytic F331
    data.currentCalculatedReservePercent = data.currentUnusedKwOversupply / data.kw15MinuteInterval;//Bill Analytic E331
    data.currentOverbill = _.round(data.currentUnusedKwOversupply , 0) * parseFloat(project.electricBillAnalysis.kwRatePerTariff);//Bill Analytic G331
    console.log('data.currentOverbill ', data.currentOverbill);
    data.recommendedCalculatedReservePercent = data.recommendedCalculatedReservePercentAsFraction;//Bill Analytic E332//Bill Analytic G332
                /*
                overbill: currencyFormatter.format(calculatedData.additionalOverbill),
                */
    data.additionalUnusedKwOversupply =  parseFloat(project.electricBillAnalysis.kwPeak) - (data.kw15MinuteInterval * (data.recommendedCalculatedReservePercentAsFraction + 1));//Bill Analytic F333

    data.additionalCalculatedReservePercent = data.currentCalculatedReservePercent - data.recommendedCalculatedReservePercent; //Bill Analytic E333

    data.additionalOverbill = _.round(data.additionalUnusedKwOversupply , 0) * parseFloat(project.electricBillAnalysis.kwRatePerTariff);//Bill Analytic G333

    data.recommendedUnusedKwOversupply = data.currentUnusedKwOversupply - data.additionalUnusedKwOversupply;//Bill Analytic F332
    data.recommendedOverbill = data.currentOverbill - data.additionalOverbill;

    if (data.additionalOverbill < 0) {
      data.additionalOverbill = 0;
      data.additionalCalculatedReservePercent = 0; 
      data.additionalUnusedKwOversupply = 0;
    }
    data.estimatedMonthlySavingsWithReserveAdjustment = data.additionalOverbill + parseFloat(project.electricBillAnalysis.totalSavings); //Bill Analytic F334
    if (data.totalCharges != 0) {
      data.estimatedMonthlySavingsPercent = data.estimatedMonthlySavingsWithReserveAdjustment / data.totalCharges;
    } else {
      data.estimatedMonthlySavingsPercent = 0;
    }
    console.log("returning data");
    return data;
  }
}
