module.exports = {


  friendlyName: 'Set equipment info',


  description: 'Set (create/update) equipment info (i.e. cost estimate, list, etc.) identified for this project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    equipmentInfo: { 
      description: 'A new dictionary of data representing info about the equipment that will be used in this project.',
      extendedDescription:
      'Includes the estimated cost, tax, discount, and list of each type of equipment and its quantity.\n'+
      'Note that this will **COMPLETELY REPLACE** any previous bill analysis.  (This is not a patch!)',
      example: {},
      required: true
    },

    meterNumber: {
      description: 'The ID of this project.',
      example: "meter1",
    }

  },


  exits: {
     success: {},

  },


  fn: function (inputs, exits) {
    Project.findOne({id: inputs.project}).exec(function (err, project) {
      inputs.equipmentInfo.meterNumber = inputs.meterNumber;
      let equipmentInfo = project.equipmentInfo && project.equipmentInfo.items ? project.equipmentInfo : inputs.equipmentInfo;
      let meterEquipment = project.equipmentInfo.meterEquipment ? project.equipmentInfo.meterEquipment : [];
      if (inputs.meterNumber) {
        console.log("set-meter-equipment for utility meter:", inputs.meterNumber);
        meterEquipment = meterEquipment.filter(meter => { return meter.meterNumber !== inputs.meterNumber});
        meterEquipment.push(inputs.equipmentInfo);
        equipmentInfo.meterEquipment = meterEquipment;
      } else {
        equipmentInfo = inputs.equipmentInfo;
        equipmentInfo.meterEquipment = meterEquipment;
      }

      Project.update({ id: inputs.project })
      .set({
        equipmentInfo: equipmentInfo
      }).exec(function(err) {
        if (err) { return exits.error(err); }
        return exits.success(equipmentInfo);
      });
    });
  }
};
