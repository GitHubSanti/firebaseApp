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

  // Update timestamp on database by second basis
  setInterval(function() {
    var timeSubmitted = moment().format("HH:mm:ss");

    database.ref("DBDetails/").set({
      dbCurrentTimestamp: timeSubmitted
    });

    database.ref("trainScheduleDetails/").update({
      firebaseTrainFirstTime: timeSubmitted
    });

    // continue to update minutes away
    // database.ref("trainDetails/").set({
    //   firebaseMinsAway: timeSubmitted
    // });
  }, 1000);

  $("#submitBtn").on("click", function(event) {
    // Prevents page from reloading when enter key is selected
    event.preventDefault();

    // Create temp variables to grab values from webpage
    var grabTrainName = "";
    var grabTrainDestination = "";
    var grabTrainFirstTime = "";
    var grabTrainFirstTimeFormatted = "";
    var grabTrainFrequency = 0;
    var minutesAway = 0;

    //   Set variables to values submitted by user
    grabTrainName = $("#trainName")
      .val()
      .trim();
    grabTrainDestination = $("#trainDestination")
      .val()
      .trim();

    grabTrainFirstTime = $("#trainFirstTime")
      .val()
      .trim();

    // Used to calculate mins away
    grabTrainFirstTime = moment(grabTrainFirstTime, "HH:mm:ss");
    console.log(grabTrainFirstTime);
    minutesAway = grabTrainFirstTime.diff(moment(), "minutes");
    if (minutesAway > 0) {
      console.log(minutesAway);
    } else if (minutesAway < 0) {
      minutesAway = minutesAway + 1440 
      console.log(minutesAway);
    } else if (minutesAway == 0) {
      console.log("train is here!")
    }

    // Format time to military time
    grabTrainFirstTimeFormatted = moment(grabTrainFirstTime, "HH:mm:ss").format(
      "HH:mm:ss"
    );

    grabTrainFrequency = $("#trainfrequency")
      .val()
      .trim();

    // Items to be sent to
    var firebaseItems = {
      firebaseTrainName: grabTrainName,
      firebaseTrainDestination: grabTrainDestination,
      firebaseTrainFirstTime: grabTrainFirstTimeFormatted,
      firebaseTrainFrequency: grabTrainFrequency,
      firebaseMinsAway: minutesAway
    };

    // Uploads employee data to the database
    database.ref("trainScheduleDetails/").push(firebaseItems);
  });

  database.ref().on("child_added", function(childSnapshot) {
    console.log(childSnapshot.val().firebaseTrainName);
    var tableTrainName = childSnapshot.val().firebaseTrainName;
    var tableTrainDestination = childSnapshot.val().firebaseTrainDestination;
    var tableTrainFrequency = childSnapshot.val().firebaseTrainFrequency;
  });
});
