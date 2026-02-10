module.exports = {


  friendlyName: 'Create test',


  description: 'Schedule a new test.',


  inputs: {

    project: {
      description: 'The ID of the project to run test on.',
      extendedDescription: 'Must be an existing project',
      example: 123,
      required: true
    },

    startAt: {
      description: 'The time that the test should start.',
      extendedDescription: 'Must be at least five minutes in the future',
      example: 12345,
      required: true
    },

    duration: {
      description: 'The time that the test should run for, in hours.',
      extendedDescription: 'Must be a positive, whole number.',
      example: 10,
      required: true
    },

    interval: {
      description: 'The time allotted to each "on" or "off" segment.',
      extendedDescription: 'Must be a positive, whole number that divides evenly into the duration and yields an even quotient.  A test "cycle" is made up of two segments of this interval.  For example, a interval of 1 would mean a two-hour cycle with two one-hour segments.',
      example: 1,
      required: true
    },

    gateways: {
      description: 'List of gateways associated with this test',
      example: [1,2,3],
      required: false
    },
  },


  exits: {
    success: {
      outputExample: {
        meta: {},
        response: {
          id: 123,
          startAt: 12345,
          duration: 10,
          interval: 1
        }
      }
    },

    startTimeTooSoon: {
      description: 'The given start time was too soon.  It must be at least 5 minutes in the future.',
      statusCode: 400
    },

    invalidDuration: {
      description: 'The given duration was invalid.',
      statusCode: 400
    },

    invalidInterval: {
      description: 'The given interval was invalid.',
      statusCode: 400
    },

    invalidStartAt: {
      description: 'The given "startAt" value was invalid.',
      statusCode: 400
    },

    unauthorized: {
      statusCode: 404
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    // Get a reference to the datastore.
    var datastore = sails.getDatastore('default');

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    var Moment = require('moment-timezone');

    var project = _.find(req.user.projects, {id: inputs.project} );

    // Make sure the start time is at least five minutes in the future.
    var curTime = (new Date()).getTime();
    var fiveMinutesFromNow = curTime + (1000 * 60 * 5);
    if (inputs.startAt < fiveMinutesFromNow) {
      return exits.startTimeTooSoon();
    }

    // Make sure the duration is a positive, whole number.
    if (inputs.duration < 0 || Math.floor(inputs.duration) !== inputs.duration) {
      return exits.invalidDuration();
    }

    // Make sure the interval is a positive, whole number that divides evenly into the duration
    // and leaves an even number of segments.
    if (inputs.interval < 0 ) {
      return exits.invalidInterval();
    }
    var numSegments = (inputs.duration / inputs.interval) * 2/3;
    if (Math.floor(numSegments) !== numSegments || ((numSegments % 2) !== 0) ) {
      return exits.invalidInterval();
    }
    // Begin a transaction.
    datastore.transaction(function(db, proceed) {

      async.auto({

        test: function(cb) {

          // Calculate the test end time.
          var endAt = inputs.startAt + (inputs.duration * 60 * 60 * 1000);

          Test.create({
            project: inputs.project,
            startAt: inputs.startAt,
            endAt: endAt,
            duration: inputs.duration,
            interval: inputs.interval
          })
            .meta({fetch: true})
            .usingConnection(db)
            .exec(cb);

        },

        switches: function(cb) {

          Switch.find({ project: inputs.project, isDeleted: false, deviceType: 1})
            .usingConnection(db)
            .exec(cb);

        },

        switchCommand: ['switches', 'test', function(result, cb) {

	  var OnSeg = 0;
          var commands = _.map(_.range(0, numSegments), function(segmentNum) {
   	    OnSeg = (segmentNum%2)?OnSeg+1:OnSeg+0;	
             var startAt = inputs.startAt + ((segmentNum+OnSeg) * inputs.interval * 3600000);
            return {
              project: inputs.project,
              commandType: sails.config.constants.SWITCH_COMMAND_TYPES[(segmentNum % 2 ? 'POWER_ON' : 'POWER_OFF')],
              startAt: startAt,
              switches: _.pluck(result.switches, 'id'),
              deviceType: 1,
              test: result.test.id,
	      conflict: true
            };
          });

	  OnSeg = 0;
          var scheduleCommands = _.map(_.range(0, numSegments), function(segmentNum) {
   	    OnSeg = (segmentNum%2)?OnSeg+1:OnSeg+0;	
             var startAt = inputs.startAt + ((segmentNum+OnSeg) * inputs.interval * 3600000);
            return {
              project: inputs.project,
              commandType: sails.config.constants.SWITCH_COMMAND_TYPES[(segmentNum % 2 ? 'POWER_ON' : 'POWER_OFF')],
              startAt: startAt,
              switches: _.pluck(result.switches, 'id'),
              deviceType: 1,
              test: result.test.id
            };
          });

          //check switchcommands with running schedule check if it conflicts with existing schedule
          Schedule.find({project: inputs.project, isCompleted: false, isDeleted: false}).exec(function(err, schedules) {
	    //console.log("here");
            async.eachLimit(scheduleCommands, 1, function(command, nextCommand) {
              let commandTime = Moment.tz(command.startAt, project.timeZoneId);
              //console.log("command time: ", commandTime.format('YYYY-MM-DD hh:mm A'), commandTime.day());
              async.eachLimit(schedules, 1, function(schedule, nextSchedule) {
		//console.log(schedule);
                command.conflict = false;
                if (schedule.daysOfWeek.includes(commandTime.day())) {
                  async.eachLimit(schedule.scheduleDetail, 1, function(schDet, nextScheduleDetail) {
                    let offTimeArr = schDet.offTime.split(':'); // split it at the colons
                    let onTimeArr = schDet.onTime.split(':');
                    let offTime = Moment.tz(command.startAt, project.timeZoneId).startOf('day').add(parseInt(offTimeArr[0]), 'hours').add(parseInt(offTimeArr[1]), 'minutes');
                    let onTime = Moment.tz(command.startAt, project.timeZoneId).startOf('day').add(parseInt(onTimeArr[0]), 'hours').add(parseInt(onTimeArr[1]), 'minutes');
		    console.log("comparing ",onTime.valueOf(), "<=", commandTime.valueOf() , "<", offTime.valueOf());
                    if (commandTime.valueOf() < offTime.valueOf() && commandTime.valueOf() >= onTime.valueOf()) {
                      console.log("found no conflict in command");
                    } else {
  //                    console.log("found conflict in command");
			if (command.commandType == sails.config.constants.SWITCH_COMMAND_TYPES['POWER_ON']) //let it power off
		      	  command.switches = command.switches.filter(val => !schedule.switches.includes(val));
//		      console.log("fixed" ,command);
                    }
		    //return nextScheduleDetail();
		  });
		 } 
                   return nextSchedule();
                 });
		 
      //          if (command.conflict == false){
                  commands.push(command);
  //                console.log("new command added");
        //        }
                return nextCommand();
              });     
//            });  

//            console.log("before" , commands);       
	    while (commands.length > 0 && commands[0].conflict == true) {
//		console.log(".");
		commands.splice(0,1);
	    }
//	    console.log("after");
//	    console.log(commands);

            // Create the switch command records.
            SwitchCommand.createEach(commands).usingConnection(db).meta({fetch: true}).exec(function(err, switchCommands) {
              if (err) { return proceed(err); }

              console.log("created switch commands now sending signals to switches");

              // Loop through each of the created switch commands.
              async.eachSeries(switchCommands, function(switchCommand, nextSwitchCommand) {
                //setTimeout(function() {
		  console.log("hi");

                 SwitchCommand.findOne({id: switchCommand.id}).populate('switches').exec(function(err, command) {
         	    console.log(switchCommand.id);
                  //switchCommand.switches = commands.find(item => item.startAt == switchCommand.startAt).switches;

                    async.eachSeries(command.switches, function(switchDevice, nextSwitch) {
			console.log(switchDevice.id);
                       	 sails.helpers.devices.sendSwitchCommand({
                          projectSlug: project.slug,
                          time: switchCommand.startAt,
                          command: switchCommand.commandType,
                          switchId: switchDevice.id,
                          switchCommandId: switchCommand.id,
                          scheduleId: 't-' + result.test.id,//'x-' + switchCommand.id
                        }).exec(function () {
			   setTimeout(function () {
			  	return nextSwitch();
		   	   }, 300);
                        });
                    }, function(err) {
			console.log("moving to next command");
			return nextSwitchCommand();
			//console.log("error setting", switchDevice.id, switchCommand.startAt);
                    });
                  });
                //}, 1000);
		   //setTimeout(function () {
	   	   //}, 535);
              });

              console.log("all test commands sent");

              // Return immediately (don't wait for the commands to go out).
              return cb(undefined, switchCommands);
            });
	  });
        }]

      }, proceed);

    }, function (err, result) {
      // If there were any errors in the above, try to cancel any switch commands that got scheduled
      // before exiting through the "error" exit.

      // Return test info through the "success" exit.
      return exits.success({
        meta: {},
        response: {
          id: result.test.id,
          startAt: result.switchCommand.startAt,
          duration: result.switchCommand.duration,
          interval: result.switchCommand.interval
        }
      });

    });
    
  }
};
