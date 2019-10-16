/******************************************* Top Level *******************************************/
//Firebase API configuration.
var firebaseConfig =
{
    apiKey: "AIzaSyDa4a4Cqw1tYa7BDXhPDFtoVoHAea0Ag3A",
    authDomain: "train-scheduler-fa6c1.firebaseapp.com",
    databaseURL: "https://train-scheduler-fa6c1.firebaseio.com",
    projectId: "train-scheduler-fa6c1",
    storageBucket: "train-scheduler-fa6c1.appspot.com",
    messagingSenderId: "975940017042",
    appId: "1:975940017042:web:35db25cfdbdfdd63e8bf4b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create a variable to reference the database.
var database = firebase.database();

//Print console stuff in debug mode.
var debug = true;

//Global variable for keeping track of train entries.
var trainID = 0;

//Create the analog clock and draw it.
var canvas = document.createElement("canvas");
canvas.id = "atime";
canvas.height = 160;
document.getElementById("canvas-div").appendChild(canvas);

var options = AClock.SUBSECONDS;
var aClock = new AClock(document.getElementById("atime"), options);
aClock.draw(moment());

//Capture submit button click.
$(document).ready(function()
{
    $("#add-train").on("click", addTrain);
});

//Animate the clock and current time underneath it.
setInterval(drawUpdate, 80);
setInterval(showTime, 80);

function drawUpdate()
{
    var myCanvas = document.getElementById("atime");
    var canvDiv = document.getElementById("canvas-div");
    myCanvas.width = canvDiv.clientWidth;
    aClock.draw(moment());
}

function showTime()
{
    var timeString = moment().format("hh:mm:ss A");
    $("#dtime").text(timeString);
}

function addTrain(event)
{
    event.preventDefault();

    //Used to check for invalid entries.
    var isInvalidName  = false;
    var isInvalidDest  = false;
    var isInvalidFirst = false;
    var isInvalidFreq  = false;

    //Get the user entered data.
    var name  = $("#name-input").val().trim();
    var dest  = $("#dest-input").val().trim();
    var first = $("#time-input").val().trim();
    var freq  = $("#freq-input").val().trim();

    /*********** Validate name input ***********/
    if(name === "")
    {
        isInvalidName = true;
    }

    //Set the text area as invalid if something is wrong.
    isInvalidName ? $("#name-input").addClass("is-invalid") : 
                    $("#name-input").removeClass("is-invalid");

    /*********** Validate dest input ***********/
    if(dest === "")
    {
        isInvalidDest = true;
    }

    //Set the text area as invalid if something is wrong.
    isInvalidDest ? $("#dest-input").addClass("is-invalid") : 
                    $("#dest-input").removeClass("is-invalid");

    /*********** Validate time input ***********/
    var timeArray = first.split(":");

    //Make sure the proper parameters have been passed.
    if(timeArray.length !== 2)
    {
        isInvalidFirst = true;
    }

    var milHours;
    var milMins;

    //Get the minutes and hours.
    if(!isInvalidFirst)
    {
        milHours = parseInt(timeArray[0]);
        milMins  = parseInt(timeArray[1]);
    }
       
    //Make sure the inputs are valid numbers.
    if(!isInvalidFirst && (isNaN(milHours) || isNaN(milMins)))
    {
        isInvalidFirst = true;
    }

    if(debug)console.log("Hours: " + milHours + ", Minutes: " + milMins);

    //Make sure the numbers are in the proper range.
    if(!isInvalidFirst && (milHours > 23 || milHours < 0 || milMins > 59 || milMins < 0))
    {
        isInvalidFirst = true;
    }

    //Set the text area as invalid if something is wrong.
    isInvalidFirst ? $("#time-input").addClass("is-invalid") : 
                     $("#time-input").removeClass("is-invalid");
    
    /*********** Validate freq input ***********/
    //Make sure a value was entered.
    var frequency = parseInt(freq);
    if(isNaN(frequency))
    {
        isInvalidFreq = true;
    }

    //Make sure entered value is greater than 0.
    if(!isInvalidFreq && frequency < 1)
    {
        isInvalidFreq = true;
    }

    //Set the text area as invalid if something is wrong.
    isInvalidFreq ? $("#freq-input").addClass("is-invalid") : 
                    $("#freq-input").removeClass("is-invalid");

    if(debug)
    {
        console.log("Train Name: " + name);
        console.log("Destination: " + dest);
        console.log("First Time: " + milHours + ":" + milMins);
        console.log("Frequency: " + frequency);
    }

    //Collect all the valid values and combine into one variable.
    var isInvalid = isInvalidName | isInvalidDest | isInvalidFirst | isInvalidFreq;

    //Exit if any values are invalid.
    if(isInvalid)
    {
        return;
    }

    //Clear data from the form.
    $("#name-input").val("");
    $("#dest-input").val("");
    $("#time-input").val("");
    $("#freq-input").val("");
    
    //Push the validated data to Firebase.
    database.ref('trains').push
    ({
        name: name,
        dest: dest,
        hours: milHours,
        mins: milMins,
        freq: frequency,
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    });
}

//Event listener that gets called whenever a child is added to Firebase.
var ref = firebase.database().ref("trains");
ref.orderByKey().on("child_added", function(snapshot)
{
    //Store the child's data.
    var sv = snapshot.val();

    //Store the child's key.
    var childKey = snapshot.key;

    if(debug)console.log(sv);

    //Extract the data from the snapshot.
    var name = sv.name;
    var dest = sv.dest;
    var hours = sv.hours;
    var mins = sv.mins;
    var freq = sv.freq;

    //Create a table row for the train data.
    var tr = $("<tr>");
    tr.attr("id", "train-row" + trainID);

    var tdName = $("<td>");
    tdName.attr("id", "train-name" + trainID);
    tdName.text(name);
    tr.append(tdName);

    var tdDest = $("<td>");
    tdDest.attr("id", "train-dest" + trainID);
    tdDest.text(dest);
    tr.append(tdDest);

    var tdFreq = $("<td>");
    tdFreq.attr("id", "train-freq" + trainID);
    tdFreq.text(freq);
    tr.append(tdFreq);

    var tdNext = $("<td>");
    tdNext.attr("id", "train-next" + trainID);
    
    //Get the first time in hh:mm.
    var firstTime = hours + ":" + mins;

    // First Time (pushed back 1 year to make sure it comes before current time)
    var firstTimeConverted = moment(firstTime, "HH:mm").subtract(1, "years");

    // Difference between the times
    var diffTime = moment().diff(moment(firstTimeConverted), "minutes");

    // Time apart (remainder)
    var tRemainder = diffTime % freq;

    // Minute Until Train
    var tMinutesTillTrain = freq - tRemainder;

    // Next Train
    var nextTrain = moment().add(tMinutesTillTrain, "minutes");

    //Update text.
    tdNext.text(moment(nextTrain).format("hh:mm A"));
    tr.append(tdNext);

    //Leave empty for now.  Will append info periodically.
    var tdAway = $("<td>");
    tdAway.attr("id", "train-away" + trainID);
    tr.append(tdAway);

    //Add a remove button.
    var tdBtn = $("<td>");
    tdBtn.addClass("remove-button");
    var btn = $("<button>");
    btn.addClass("btn btn-default");
    btn.text("X");
    btn.attr("id", "btn" + trainID);
    tdBtn.append(btn);
    tr.append(tdBtn);
    
    //Remove entry from the webpage and database.
    btn.on("click", function()
    {
        //Remove value from the webpage.
        tr.remove();

        //Remove value from the database.
        var ref = firebase.database().ref("trains/" + childKey);
        ref.remove();    
    });

    //Make sure each train has a unique trainID.
    trainID++;

    //Add the data to the webpage!
    $("#table-body").prepend(tr);

    //Update the tables periodically.
    setInterval(function()
    {
        // Difference between the times
        var diffTime = moment().diff(moment(firstTimeConverted), "minutes");

        // Time apart (remainder)
        var tRemainder = diffTime % freq;

        // Minute Until Train
        var tMinutesTillTrain = freq - tRemainder;

        // Next Train
        var nextTrain = moment().add(tMinutesTillTrain, "minutes");

        //Update text.
        tdNext.text(moment(nextTrain).format("hh:mm A"));

        //Do some extra calculations to get minutes and seconds.
        thisTime = moment();
        nextTime = moment(nextTrain).format("hh:mm A").toString();
        diffTime = moment().diff(moment(nextTime, "hh:mm A"), "seconds");
        
        //DiffTime now contains the seconds until the next train.
        diffTime = Math.abs(diffTime);

        //Get the seconds remaining.
        var secRemaining = diffTime % 60;

        //Get the hours remaining and update diffTime.
        var hourRemaining = Math.floor(diffTime / 3600);
        diffTime -= hourRemaining * 3600;

        //Get the total minutes remaining and update diffTime.
        var minRemaining = Math.floor(diffTime / 60);
        diffTime -= minRemaining * 60;

        //Get the seconds remaining.
        secRemaining = diffTime;

        //Prepend zeros if necessary.
        hourRemaining = (hourRemaining < 10) ? "0" + hourRemaining : hourRemaining;
        minRemaining  = (minRemaining < 10)  ? "0" + minRemaining  : minRemaining;
        secRemaining  = (secRemaining < 10)  ? "0" + secRemaining  : secRemaining;

        //Generate final text string.
        diffString = hourRemaining + ":" + minRemaining + ":" + secRemaining;
        tdAway.text(diffString);

        //Make the time remaining red if a train will arrive in less than a minute.
        if(hourRemaining === "00" && minRemaining === "00")
        {
            tdAway.addClass("time-low");
        }
        else
        {
            tdAway.removeClass("time-low");
        }

    }, 200);
},
function(errorObject) //Handle the errors.
{
    console.log("Errors handled: " + errorObject.code);
});
