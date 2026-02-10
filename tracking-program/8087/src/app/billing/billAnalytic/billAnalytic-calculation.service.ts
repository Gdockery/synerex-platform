import {Inject, Injectable} from "@angular/core";

import {PartService} from "../equipment/parts.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";

@Injectable()
export class BillAnalyticCalculationsService  {

  private project;
  private originalItemCount;

  constructor(
    private partService: PartService,
    
    private currentUserService: CurrentUserService,
    @Inject('ELECTRICITY_CHARGE_TYPES') private ELECTRICITY_CHARGE_TYPES,
    private timeHelpers: TimeHelpers
  ) {
    this.project = currentUserService.user.selectedProject;

    /*this.itemService.getAll().subscribe(data => {
      this.items = data.response;
    });*/
  }

  calculateTotalsBeforeService(items, parts) {
    let itemTotal = 0;
    items.forEach(function(item) {
      itemTotal += parseFloat(item.value.price) * parseInt(item.value.count);
    });

    let partTotal = {
      taxable: 0,
      nonTaxable: 0,
    };

    parts.forEach(function(part) {
      if(part.value.taxable) {
        partTotal.taxable += parseFloat(part.value.price) * parseInt(part.value.count);
      } else {
        partTotal.nonTaxable += parseFloat(part.value.price) * parseInt(part.value.count);
      }
    });

    let beforeServicesTotals:any = {
      itemTotal: itemTotal,
      subtotal: partTotal.taxable + partTotal.nonTaxable + itemTotal,
    };

    return beforeServicesTotals;
  }

  calculateTotals(items, parts, services) {
    let itemTotal = 0;
    items.forEach(function(item) {
      itemTotal += parseFloat(item.value.price) * parseInt(item.value.count);
    });

    let serviceTotal = 0;
    services.forEach(function(service) {
      serviceTotal += parseFloat(service.value.price);
    });

    let partTotal = {
      taxable: 0,
      nonTaxable: 0,
    };
    parts.forEach(function(part) {
      if(part.value.taxable) {
        partTotal.taxable += parseFloat(part.value.price) * parseInt(part.value.count);
      } else {
        partTotal.nonTaxable += parseFloat(part.value.price) * parseInt(part.value.count);
      }
    });

    /*let partTotal = parts.reduce((total, part) => {
      if (part.value.taxable) {
        total.taxable += parseFloat(part.value.price) * parseInt(part.value.count);
      } else {
        total.nonTaxable += parseFloat(part.value.price) * parseInt(part.value.count);
      }
      return total;
    }, {taxable:0,nonTaxable:0}); */

    let totals:any = {
      itemTotal: itemTotal,
      subtotal: partTotal.taxable + partTotal.nonTaxable + itemTotal + serviceTotal,
      tax: (partTotal.taxable + itemTotal) * this.project.salesTax / 100,
    };

    const taxedTotal = totals.subtotal + totals.tax;
    // only take discount off xps units
    totals.discount = totals.itemTotal * this.project.discount / 100;
    totals.total = taxedTotal - totals.discount;

    return totals;
  }

  fillPartTotals(items, parts, analytic) {
    let allItemsCount = 0;

    let origCount = Math.ceil(parseFloat(analytic.kwPeak) / parseFloat(analytic.kWPerUnit));
    let unitCount;
    let boosterCount;
    let filterCount;
    let itemCount = items.reduce((total, item) => {
      total += parseInt(item.value.count);
      //console.log("item:" , item);
      if (item.value.name !== 'XPS600') {
	allItemsCount += item.value.count;
	if (item.value.name === 'XECO600B')
	    boosterCount = item.value.count;
	if (item.value.name === 'XPF480-100')
	    filterCount = item.value.count;
      }
      return total;
    }, 0);
    console.log("allItemsCount:" , allItemsCount);

    unitCount = origCount - (filterCount * 2);

    items.forEach(function(item) {
      if (item.value.name === 'XPS600') {
         console.log("trying");
         item.controls.count.setValue(unitCount);
      }
    });

    parts.forEach(part => {
      let partType = this.partService.get(part.value.name);
      switch(partType ? partType.countType : '') {
        case 'item':
          part.controls.count.setValue(Math.ceil((unitCount-(boosterCount*2)) * part.value.factor));
          break;
        case 'manual':
          if (part.value.name == 'XPF480-LC5A (Power Filter Load Controller)') {
            part.controls.count.setValue(Math.ceil(filterCount * part.value.factor));
          } else {
            part.controls.count.setValue(0);
	  }
          break;
        case 'single':
          part.controls.count.setValue(1);
          break;
        case 'mainCircuit':
          part.controls.count.setValue(Math.ceil(analytic.mainCircuitCount * part.value.factor));
          break;
        case 'switchGear':
          if (part.value.name == 'XLC90 (90 Amp Load Controller)' || part.value.name == 'Revenue Grade Meter' || part.value.name == '24" Rocoil CTs') {
            part.controls.count.setValue(Math.ceil(boosterCount * part.value.factor));
          } else {
            part.controls.count.setValue(Math.ceil(analytic.switchGearCount * part.value.factor));
	  }
          break;
        case 'manager':
          part.controls.count.setValue(1);
          //@Todo: Set the cost to the manager to the percent pulled from globals applied to total savings.
          // part.controls.cost.setValue();
          break;
      }
    });
  }

  calculateRoi() {
    if(this.project.equipmentInfo && this.project.equipmentInfo.total && this.project.electricBillAnalysis) {
      return this.project.equipmentInfo.total.total / this.project.electricBillAnalysis.totalSavings;
    }
    return 0;
  }

  calculateRemainingRoi() {
    if(this.project.equipmentInfo && this.project.equipmentInfo.total && this.project.electricBillAnalysis) {
      let startDate = this.timeHelpers.momentForUserTz(this.project.startDate);
      let currentDate = this.timeHelpers.momentForUserTzUnadjusted();
      let duration = startDate.diff(currentDate, 'months');
      return this.project.equipmentInfo.total.total / this.project.electricBillAnalysis.totalSavings - duration;
    }
    return 0;
  }

}
