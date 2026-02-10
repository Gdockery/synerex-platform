module.exports = {
  calculate: function(project, bills) {
    let sumBillAmount = 0, sumKwh = 0, voltage = 0, sumPeak = 0, sumCustomerCharge = 0, sumSwitchGear = 0, sumMainCircuit = 0, sumTotalSavings = 0, sumKwRatePerTariff = 0;
    let sumLineItems = [{'name': 'KWH Charges', 'type': 'kwh', 'cost': 0, 'billingRate': 0, 'savings': 0}, {'name': 'KW Charges', 'type': 'kw', 'cost': 0, 'billingRate': 0, 'savings': 0}, {'name': 'Tax Charges', 'type': 'tax', 'cost': 0, 'savings': 0}, {'name': 'Miscellaneous Charges', 'type': 'm', 'cost': 0, 'savings': 0}, {'name': 'X Charges', 'type': 'x', 'cost': 0, 'savings': 0}];
    project.electricBillAnalysis.meterBills.forEach(function(bill) {
     
      if (!(bills) || bills.includes(bill.meterNumber)) {
        console.log ('--> sbac bills.includes(bill.meterNumber) was true');
        sumKwh += parseFloat(bill.totalKwh);
        sumPeak += parseFloat(bill.kwPeak);
        sumBillAmount += parseFloat(bill.billAmount);
	voltage = parseFloat(bill.voltage);
        sumTotalSavings += parseFloat(bill.totalSavings);
        sumCustomerCharge += parseFloat(bill.customerCharge);
        sumSwitchGear += parseInt(bill.switchGearCount);
        sumMainCircuit += parseInt(bill.mainCircuitCount);
        sumKwRatePerTariff += parseFloat(bill.kwRatePerTariff);
        let billBillingRate = 0, billAvgRate = 0, kwhSaving = 0, kwSaving = 0, kwhCost = 0, kwCost = 0, mSaving = 0, mCost = 0, taxSaving = 0, taxCost = 0, xSaving = 0, xCost = 0;
        bill.lineItems.forEach(function(lineItem) {
          if (lineItem.type == "kwh") {
            billBillingRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
            kwhSaving += lineItem.savings;
            kwhCost+= parseFloat(lineItem.cost);
          } else if (lineItem.type == "kw") {
            billAvgRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
            kwSaving += lineItem.savings;
            kwCost += parseFloat(lineItem.cost);
          } else if (lineItem.type == "m") {
            mSaving += lineItem.savings;
            mCost += parseFloat(lineItem.cost);
          } else if (lineItem.type == "tax") {
            taxSaving += lineItem.savings;
            taxCost += parseFloat(lineItem.cost);
          } else if (lineItem.type == "x") {
            xSaving += lineItem.savings;
            xCost += parseFloat(lineItem.cost);
          }
        });
        console.log ("done with lineItem");

        sumLineItems.forEach(function(sumLineItem) {
          if (sumLineItem.type == "kwh") {
            sumLineItem.billingRate += billBillingRate;
            sumLineItem.cost += kwhCost;
            sumLineItem.savings += kwhSaving;
          } else if (sumLineItem.type == "kw") {
            sumLineItem.billingRate += billAvgRate;
            sumLineItem.cost += kwCost;
            sumLineItem.savings += kwSaving;
          } else if (sumLineItem.type == "m") {
            sumLineItem.cost += mCost;
            sumLineItem.savings += mSaving;
          } else if (sumLineItem.type == "tax") {
            sumLineItem.cost += taxCost;
            sumLineItem.savings += taxSaving;
          } else if (sumLineItem.type == "x") {
            sumLineItem.cost += xCost;
            sumLineItem.savings += xSaving;
          }
        });
        console.log ("done with sumLineItem");
      }
    });
      // get average rate of bills for meters;
    sumLineItems.forEach(function(sumLineItem) {
        if (sumLineItem.type == "kwh" || sumLineItem.type == "kw") {
          sumLineItem.billingRate = sumLineItem.billingRate / project.electricBillAnalysis.meterBills.length;
        } 
    });
    console.log ("done with forEach sumLineItem");
    project.electricBillAnalysis.kwRatePerTariff = sumKwRatePerTariff / project.electricBillAnalysis.meterBills.length;
    project.electricBillAnalysis.billAmount = sumBillAmount;
    project.electricBillAnalysis.totalKwh = sumKwh;
    project.electricBillAnalysis.kwPeak = sumPeak;
    project.electricBillAnalysis.voltage = voltage; //didn't change
    project.electricBillAnalysis.customerCharge = sumCustomerCharge;
    project.electricBillAnalysis.switchGearCount = sumSwitchGear;
    project.electricBillAnalysis.mainCircuitCount = sumMainCircuit;
    project.electricBillAnalysis.lineItems = sumLineItems;
    project.electricBillAnalysis.totalSavings = sumTotalSavings;

    console.log ("done with electricBillAnalysis");
    let data = project.electricBillAnalysis
    
    return data;
  }
}
