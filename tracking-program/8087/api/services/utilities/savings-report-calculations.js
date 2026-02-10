module.exports = {
    calculateReport: function(project, report, pfConstant) {
        var currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: project.currencyCode,
            minimumFractionDigits: 2,
        });

        var numberFormatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        var usage = report.reportData.usageKWH;
        var avgRate = 0;
       
        var billingRate = 0;

        if (report.reportData.lineItems) {
            report.reportData.lineItems.forEach(function(lineItem){
                if (lineItem.type == "kwh" && lineItem.tierHours != "0" && lineItem.tierHours != "null" && lineItem.tierHours != null){
                    avgRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                }
                if (lineItem.type == "kw" && lineItem.tierHours != "0" && lineItem.tierHours != "null" && lineItem.tierHours != null){
                    billingRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                }
            });
        } else {
            avgRate = project.kwhRate;
            billingRate = project.kwRate;
        } 

        //calculate kwhSavings $
        
        
        let moment = require('moment');
        let data = {};
        data.usage = usage; // Full Month C16
        data.month = report.month;
        data.kwhSavingsPercent = report.reportData.kwhSavings / 100;
      
        
        data.totalBillValue = parseFloat(report.reportData.totalBill*project.multiplier);
        data.totalBill = currencyFormatter.format(data.totalBillValue*project.multiplier);
        
        data.kwhReductionValue = data.usage * data.kwhSavingsPercent*project.multiplier;
        data.kwhReduction = _.round(data.kwhReductionValue*project.multiplier, 2);
        
        data.kwPeak = report.reportData.kwPeak*project.multiplier;
        data.kwPeakSavingsPercent = report.reportData.kwPeakSavings / 100;
        
        data.kwPeakSavingsValue = data.kwPeak * data.kwPeakSavingsPercent*project.multiplier;
        data.kwPeakSavings = _.round(data.kwPeakSavingsValue, 2);
        
        data.kwPeakSavingsDolValue = data.kwPeakSavings * billingRate*project.multiplier;
        data.kwPeakSavingsDol = currencyFormatter.format(data.kwPeakSavingsDolValue);
        
        data.kwhSavingsDolValue = data.kwhReductionValue * avgRate*project.multiplier;
        data.kwhSavingsDol = currencyFormatter.format(data.kwhSavingsDolValue);

        data.powerLossKwhValue = data.kwhReductionValue * pfConstant*project.multiplier;
        data.powerLossKwh = _.round(data.powerLossKwhValue*project.multiplier, 2);
        data.powerLossSavingsValue = data.powerLossKwhValue * avgRate*project.multiplier;
        data.powerLossSavings = currencyFormatter.format(data.powerLossSavingsValue*project.multiplier);

        data.powerFactorLossSavingsValue = report.reportData.pfc * -1;
        data.powerFactorLossSavings = currencyFormatter.format(data.powerFactorLossSavingsValue);

        data.billingDays = moment(report.toDate).diff(moment(report.fromDate), 'days');// Full Month D16
        data.billingHours = data.billingDays * 24;// Full month E16,K16
        data.minKwInterval = data.usageKWH*project.multiplier / data.billingHours;//Full Month F16

        data.totalSavingsValue = data.kwPeakSavingsDolValue + data.kwhSavingsDolValue + data.powerLossSavingsValue + data.powerFactorLossSavingsValue;
        data.totalSavings = currencyFormatter.format(data.totalSavingsValue);

        data.billWithoutXecoValue = data.totalBillValue + data.totalSavingsValue;
        data.billWithoutXeco = currencyFormatter.format(data.billWithoutXecoValue);
        data.totalSavingsPercent = _.round((data.totalSavingsValue / data.billWithoutXecoValue) * 100, 2);
        
        //data.savings = project.kvaSavings;//Full Month H16
        //data.avg15MinuteLines = data.minKwInterval * data.savings; //Full Month I16
        data.meteredKvaSavings = data.avg15MinuteLines * data.billingHours; //Full Month L16
        data.co2ReductionValue = (0.7054/1000) * data.kwhReduction;
        data.co2Reduction = _.round(data.co2ReductionValue, 2);
        data.co2RateValue = project.carbonCreditRate;
        data.co2Rate = _.round(data.co2RateValue, 2);
        data.co2ValueValue = data.co2Reduction * data.co2Rate;
        data.co2Value = currencyFormatter.format(data.co2ValueValue);

        //STRATEGIC OPERATIONS & PERFORMANCE STATISTICS page
        data.billCycle = data.month;
        data.kvaUsedValue = data.usage / data.billingHours;
        data.kvaUsed = _.round(data.kvaUsedValue);
        data.availableCapacityValue = data.kwPeak - data.kvaUsedValue;
        data.availableCapacity = _.round(data.availableCapacityValue);
        data.availableKvaCapacityValue = (data.availableCapacity / data.kwPeak) * 100;
        data.availableKvaCapacity = _.round(data.availableKvaCapacityValue);

        data.btuReductionValue = data.availableCapacityValue * 1000;
        data.btuReduction = _.round(data.btuReductionValue);
        data.thermsReductionValue = data.availableCapacityValue / 29.2243243;
        data.thermsReduction = _.round(data.thermsReductionValue);
        data.horsepowerReductionValue = data.availableCapacityValue / 0.746;
        data.horsepowerReduction = _.round(data.horsepowerReductionValue);

        return data;
    }
  
}
