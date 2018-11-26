$(document).ready(function() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDCkBvH0KJ-6wWJAn4u_IQsG05WsyqiFXA",
        authDomain: "firetrain-215bb.firebaseapp.com",
        databaseURL: "https://firetrain-215bb.firebaseio.com",
        projectId: "firetrain-215bb",
        storageBucket: "firetrain-215bb.appspot.com",
        messagingSenderId: "521162968471"
    };
    firebase.initializeApp(config);

    // Create a variable to reference the database.
    var database = firebase.database();

    // Update timestamp on database on a second basis
    setInterval(() => {
        var timeSubmitted = moment().format("HH:mm:ss");
        database.ref().update({
            dbCurrentTimestamp: timeSubmitted,
        });
    }, 500);

    // Updates minutes away for each train schedule
    setInterval(() => {
        database.ref("trainScheduleDetails").once("value").then(function(dbvalue) {

            for (let index = 1; index < dbvalue.numChildren() + 1; index++) {
                database.ref("trainScheduleDetails/train" + index + "/firebaseTrainNextArrivalTime").once("value").then(function(dbvalue) {
                    var newSecsAway = moment(dbvalue.val(), "HH:mm:ss").diff(moment(), "seconds");
                    var newMinsAway;
                    if (newSecsAway < 0) {
                        newSecsAway = newSecsAway + 86400
                    } else if (newSecsAway == 0) {
                        database.ref("trainScheduleDetails/train" + index + "/firebaseTrainFrequency").once("value").then(function(dbvalue) {
                            newMinsAway = dbvalue.val();
                            database.ref("trainScheduleDetails/train" + index).update({
                                firebaseMinsAway: newMinsAway
                            })
                        })
                        database.ref("trainScheduleDetails/train" + index + "/firebaseTrainNextArrivalTime").once("value").then(function(dbvalue) {
                            var newTrainArrivalTime = moment(dbvalue.val(), "HH:mm").add(newMinsAway, 'minutes').format("HH:mm");
                            database.ref("trainScheduleDetails/train" + index).update({
                                firebaseTrainNextArrivalTime: newTrainArrivalTime
                            })
                        })
                    }
                    // Convert to minutes and round down
                    newMinsAway = Math.ceil(newSecsAway / 60);
                    database.ref("trainScheduleDetails/train" + index).update({
                        // firebaseSecsAway: newSecsAway,
                        firebaseMinsAway: newMinsAway
                    })
                })
            }
        })
    }, 1000);

    $("#submitBtn").on("click", function(event) {
        // Prevents page from reloading when enter key is selected
        event.preventDefault();

        // Create temp variables to grab values from webpage
        var grabTrainName = "";
        var grabTrainDestination = "";
        var grabNextTrainTime = "";
        var grabTrainNextArrivalTimeFormatted = "";
        var grabTrainFrequency = 0;
        var minsAway = 0 // Will use to keep html page updated
        var secondsAway = 0; // Will use to update all other time related items

        //   Set variables to values submitted by user
        grabTrainName = $("#trainName")
            .val()
            .trim();
        grabTrainDestination = $("#trainDestination")
            .val()
            .trim();

        grabNextTrainTime = $("#trainNextArrivalTime")
            .val()
            .trim();

        // Used to calculate mins away
        grabNextTrainTime = moment(grabNextTrainTime, "HH:mm:ss");
        secondsAway = grabNextTrainTime.diff(moment(), "seconds");
        if (secondsAway < 0) {
            secondsAway = secondsAway + 86400
        }
        // Convert to mins away and round down
        minsAway = Math.ceil(secondsAway / 60)
        // Format time to military time
        grabTrainNextArrivalTimeFormatted = moment(grabNextTrainTime, "HH:mm:ss").format(
            "HH:mm"
        );

        grabTrainFrequency = $("#trainFrequency")
            .val()
            .trim();

        // Items to be sent to database upon creation of train schedule
        var firebaseItems = {
            firebaseTrainName: grabTrainName,
            firebaseTrainDestination: grabTrainDestination,
            firebaseTrainNextArrivalTime: grabTrainNextArrivalTimeFormatted,
            firebaseTrainFrequency: grabTrainFrequency,
            firebaseMinsAway: minsAway,
            firebaseSecsAway: secondsAway
        };

        // Used for unique ID given to each train schedule
        var trainScheduleID;
        // Send data to firebase and give unique ID to transaction
        database.ref("trainScheduleDetails").once('value').then(function(dbvalue) {
            trainScheduleID = dbvalue.numChildren() + 1
            database.ref("trainScheduleDetails/train" + trainScheduleID).set(firebaseItems);
            // Provide unique ID for HTML row inserted in Current Train Schedule Section
            var trainScheduleHTMLROWID = "train" + trainScheduleID
            var trainRow = $("<tr>");
            trainRow.attr("id", trainScheduleHTMLROWID);
            // Provide unique ID for train name col of row
            var trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainName"
            var trainRowColTrainName = $("<td>"); // Train Name col
            trainRowColTrainName.attr("id", trainScheduleHTMLROWCOLID);
            // Set Train Name col to what is saved in firebase
            database.ref("trainScheduleDetails/" + trainScheduleHTMLROWID + "/firebaseTrainName").on('value', function(dbvalue) {
                trainRowColTrainName.text(dbvalue.val());
            })
            // Provide unique ID for train destination col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainDestination"
            var trainRowColDestination = $("<td>"); // Destination col
            trainRowColDestination.attr("id", trainScheduleHTMLROWCOLID);
            // Set Train Destination col to what is saved in firebase
            database.ref("trainScheduleDetails/" + trainScheduleHTMLROWID + "/firebaseTrainDestination").on('value', function(dbvalue) {
                trainRowColDestination.text(dbvalue.val())
            })
            // Provide unique ID for train frequency col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainFrequency"
            var trainRowColFreq = $("<td>"); // Frequency (min) col
            trainRowColFreq.attr("id", trainScheduleHTMLROWCOLID);
            // Set Train Frequency col to what is saved in firebase
            database.ref("trainScheduleDetails/" + trainScheduleHTMLROWID + "/firebaseTrainFrequency").on('value', function(dbvalue) {
                trainRowColFreq.text(dbvalue.val());
            })
            // Provide unique ID for train next arrival time col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainNextArrivalTime"
            var trainRowColNextArrival = $("<td>"); // Next Arrival Time col
            trainRowColNextArrival.attr("id", trainScheduleHTMLROWCOLID);
            database.ref("trainScheduleDetails/" + trainScheduleHTMLROWID + "/firebaseTrainNextArrivalTime").on('value', function(dbvalue) {
                trainRowColNextArrival.text(dbvalue.val());
            })
            // Provide unique ID for train mins away col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseMinsAway"
            var trainRowColMinsAway = $("<td>") // Mins Away col
            trainRowColMinsAway.attr("id", trainScheduleHTMLROWCOLID)
            database.ref("trainScheduleDetails/" + trainScheduleHTMLROWID + "/firebaseMinsAway").on('value', function(dbvalue) {
				trainRowColMinsAway.text(dbvalue.val());
            })
            // Append Train schedule row onto HTML tbody element id #trainSchedules
            $("#trainSchedules").append(trainRow);
            trainRow.append(trainRowColTrainName);
            trainRow.append(trainRowColDestination);
            trainRow.append(trainRowColFreq);
            trainRow.append(trainRowColNextArrival);
            trainRow.append(trainRowColMinsAway);
        });
    });
	
    // Initial updates HTML page with train schedules already saved in firebase
    database.ref("trainScheduleDetails").once("value").then(function(dbvalue) {
        for (let index = 1; index < dbvalue.numChildren() + 1; index++) {
            // Provide unique ID for HTML row inserted in Current Train Schedule Section
            var trainScheduleHTMLROWID = "train" + index
            var trainRow = $("<tr>");
            trainRow.attr("id", trainScheduleHTMLROWID);
            // Provide unique ID for train name col of row
            var trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainName"
            var trainRowColTrainName = $("<td>"); // Train Name col
            trainRowColTrainName.attr("id", trainScheduleHTMLROWCOLID);
            database.ref("trainScheduleDetails/train" + index + "/firebaseTrainName").on("value", function(dbvalue) {
				trainRowColTrainName.text(dbvalue.val());
			})
            // Provide unique ID for train destination col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainDestination"
            var trainRowColDestination = $("<td>"); // Destination col
            trainRowColDestination.attr("id", trainScheduleHTMLROWCOLID);
            database.ref("trainScheduleDetails/train" + index + "/firebaseTrainDestination").on("value", function(dbvalue) {
				trainRowColDestination.text(dbvalue.val());
			})
            // Provide unique ID for train frequency col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainFrequency"
            var trainRowColFreq = $("<td>"); // Frequency (min) col
            trainRowColFreq.attr("id", trainScheduleHTMLROWCOLID);
            database.ref("trainScheduleDetails/train" + index + "/firebaseTrainFrequency").on("value", function(dbvalue) {
				trainRowColFreq.text(dbvalue.val());
			})
            // Provide unique ID for train next arrival time col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseTrainNextArrivalTime"
            var trainRowColNextArrival = $("<td>"); // Next Arrival Time col
            trainRowColNextArrival.attr("id", trainScheduleHTMLROWCOLID);
            database.ref("trainScheduleDetails/train" + index + "/firebaseTrainNextArrivalTime").on("value", function(dbvalue) {
				trainRowColNextArrival.text(dbvalue.val());
			})
            // Provide unique ID for train mins away col of row
            trainScheduleHTMLROWCOLID = trainScheduleHTMLROWID + "-firebaseMinsAway"
            var trainRowColMinsAway = $("<td>") // Mins Away col
            trainRowColMinsAway.attr("id", trainScheduleHTMLROWCOLID)
            database.ref("trainScheduleDetails/train" + index + "/firebaseMinsAway").on("value", function(dbvalue) {
				trainRowColMinsAway.text(dbvalue.val());
			})
			// Append Train schedule row onto HTML tbody element id #trainSchedules
            $("#trainSchedules").append(trainRow);
            trainRow.append(trainRowColTrainName);
            trainRow.append(trainRowColDestination);
            trainRow.append(trainRowColFreq);
            trainRow.append(trainRowColNextArrival);
			trainRow.append(trainRowColMinsAway);
        }
    })

	// Provides updates on current number of train schedules after submission of train schedule
	database.ref("trainScheduleDetails").on("value", function(dbvalue) {
		console.log("Current number of trains: " + dbvalue.numChildren())
		database.ref().update({
			dbTrainScheduleCount: dbvalue.numChildren()
		})
	})
});
