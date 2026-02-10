module.exports = {
  calculate: function(project, metersToReport) {
    let equipments = {};
    console.log("start calculator");
  
    if (!metersToReport) {
        console.log("!metersToReport");
        console.log(project.equipmentInfo);
        if (project.equipmentInfo.meterEquipment == null) {
            equipments = project.equipmentInfo;
        } else {
            equipments = project.equipmentInfo.meterEquipment;
        }
    } else {
	    console.log("metersToReport");
        equipments = project.equipmentInfo.meterEquipment.filter(meter => { return metersToReport.includes(meter.meterNumber)});
    }

    console.log("st2");
    if (!equipments) { 
        console.log("return project.equipmentInfo");
        return project.equipmentInfo;
    }

    console.log("st3");
    let equipmentInfo = "";
    if (equipments.length > 1) { //first one is cascade wtf
        console.log("equipments[1]:",equipments[1]);
        equipmentInfo = equipments[1];
    } else {
        console.log("equipments:",equipments);
        equipmentInfo = equipments;
    }

    console.log("st4");
    console.log(equipmentInfo);

    //equipmentInfo.total.discount = equipmentInfo.total.itemTotal * project.discount / 100;
    console.log("st5");
    if (equipments.length > 2) {
    console.log("st6");
  
        for (i = 2; i < equipments.length; i++) {
            let services = [];
            console.log("equipments[",i,"].services:", equipments[i].services);
            equipments[i].services.forEach(function(service) {
                let tempService = equipmentInfo.services.find(serv => {return serv.name == service.name});
                tempService.price = parseFloat(tempService.price) + parseFloat(service.price);
                services.push(tempService);
            });

            equipmentInfo.services = services;
            console.log("equipmentInfo.services", equipmentInfo.services);
            let parts = [];
            console.log("equipments[",i,"].parts:", equipments[i].parts);
            equipments[i].parts.forEach(function(part) {
                let tempPart = equipmentInfo.parts.find(p => {return p.name == part.name});
                tempPart.count = parseInt(tempPart.count) + parseInt(part.count);
                //console.log("tempPart.count += part.count");
                //console.log(tempPart.count);
                parts.push(tempPart);
            });

            equipmentInfo.parts = parts;
            console.log("equipmentInfo.parts", equipmentInfo.parts);
            let items = [];
            console.log("equipments[",i,"].items:", equipments[i].items);
            equipments[i].items.forEach(function(item) {
                let tempItem = equipmentInfo.items.find(it => {return it.name == item.name});
                tempItem.count = parseInt(tempItem.count) + parseInt(item.count);
                items.push(tempItem);
            });
            equipmentInfo.items = items;
            console.log("equipmentInfo.items", equipmentInfo.items);

            equipmentInfo.total.itemTotal = equipments[i].total.itemTotal + equipmentInfo.total.itemTotal;
            equipmentInfo.total.subtotal = equipments[i].total.subtotal + equipmentInfo.total.subtotal;
            equipmentInfo.total.tax = equipments[i].total.tax + equipmentInfo.total.tax;
            //equipmentInfo.total.discount = equipments[i].total.discount + equipmentInfo.total.discount;
            equipmentInfo.total.discount = (equipmentInfo.total.itemTotal * project.discount / 100) + equipmentInfo.total.discount;
            equipmentInfo.total.total = equipments[i].total.total + equipmentInfo.total.total;
            console.log("equipmentInfo.total.total", equipmentInfo.total.total);
            //console.log(equipmentInfo);
        }
    }
    console.log("Equipments Calculator Done");
    return equipmentInfo;
  }
}
