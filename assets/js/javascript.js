/************************************** Analog Clock Class ***************************************/
//Options bit flags.
const SUBSECONDS       = 0x001; //Set = second hand moves every 1/6th of a second.
const HIDE_RING        = 0x002; //Set = hide outer clock ring.
const HIDE_CENTER      = 0x004; //Set = hide center circle.
const HIDE_SECONDS     = 0x008; //Set = hide second hand.
const HIDE_MINUTES     = 0x010; //Set = hide minute hand.
const HIDE_HOURS       = 0x020; //Set = hide hour hand.
const HIDE_MINUTE_TICK = 0x040; //Set = hide minute ticks.
const HIDE_MINOR_TICK  = 0x080; //Set = hide minor hour ticks.
const HIDE_MAJOR_TICK  = 0x100; //Set = hide major hour ticks.

//NOTE: If subseconds is active and AClock is being used to animate a clock, the timer interval
//for the animation shoud be 80 milliseconds to ensure a proper sweeping motion of the second
//hand.  If subseconds is disabled, 490 milliseconds should be used.
class AClock
{
    constructor
    (
        //canvas in the only required parameter in the constructor.  It is the reference to the
        //canvas that the clock will be drawn on.  options holds the bit flags shown above.
        canvas, options = 0x000,

        //These variables are the colors of the various clock components.
        secondColor     = "#ff0000", minuteColor    = "#000000", hourColor      = "#000000", 
        outerRingColor  = "#000000", centerColor    = "#000000",
        minuteTickColor = "#8f8f8f", minorTickColor = "#8f8f8f", majorTickColor = "#8f8f8f",

        //These variables control the thickness in pixels of the various clock components.
        secondWidth     = 2, minuteWidth    = 4, hourWidth      = 6,
        outerRingWidth  = 3, centerWidth    = 5,
        minuteTickWidth = 1, minorTickWidth = 2, majorTickWidth = 3,

        //These variables control the lengths and radiuses of the clock components.
        //radiusLen scales the entire clock and is the percentage of the canvas that is used
        //by the clock(based on the shortest axis of the canvas). secondLen, minuteLen and hourLen
        //control the hand lengths.  The values represent a percentage of the clock radius.
        //centerRad is the radius of the center circle in pixels. minuteTickLen, minorTickLen,
        //and majorTickLen are the lengths of the ticks on the outer clock ring. The length of
        //the ticks is 1 - the given value.  For example, if minuteTickLen is .90, then the total
        //length of the tick is 1 - .90 = .1. The minute ticks will be 10% of the clock radius.
        secondLen     = .90, minuteLen    = .75, hourLen      = .60,
        radiusLen     = .95, centerRad    = 2  ,
        minuteTickLen = .90, minorTickLen = .85, majorTickLen = .80
    )
    {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.canvasWidth;
        this.canvasHeight;
        this.canvasMiddleX;
        this.canvasMiddleY;
        this.radius;

        //Optional arguments from above.
        this.options         = options;
        this.secondColor     = secondColor;
        this.minuteColor     = minuteColor;
        this.hourColor       = hourColor; 
        this.outerRingColor  = outerRingColor;
        this.centerColor     = centerColor;
        this.minuteTickColor = minuteTickColor;
        this.minorTickColor  = minorTickColor;
        this.majorTickColor  = majorTickColor;
        this.secondWidth     = secondWidth;
        this.minuteWidth     = minuteWidth;
        this.hourWidth       = hourWidth;
        this.outerRingWidth  = outerRingWidth;
        this.centerWidth     = centerWidth;
        this.minuteTickWidth = minuteTickWidth;
        this.minorTickWidth  = minorTickWidth;
        this.majorTickWidth  = majorTickWidth;
        this.secondLen       = secondLen;
        this.minuteLen       = minuteLen;
        this.hourLen         = hourLen;
        this.radiusLen       = radiusLen;
        this.centerRad       = centerRad;
        this.minuteTickLen   = minuteTickLen;
        this.minorTickLen    = minorTickLen;
        this.majorTickLen    = majorTickLen;

        //Convert radians to degrees (divide clock into 360 pieces).
        this.oneDegree = Math.PI / 180;

        //Calculate 6/1000th of a second.  Used for second hand positioning.
        this.secondConst = 6 / 1000;
    }

    //This is the function that draws the moment as a clock.
    draw(thisMoment)
    {
        //Get canvas height and width.
        this.canvasWidth = this.canvas.clientWidth;
        this.canvasHeight = this.canvas.clientHeight;
                
        //Calculate the center of the canvas.
        this.canvasMiddleX = this.canvasWidth / 2;
        this.canvasMiddleY = this.canvasHeight / 2;

        //Calculate the drawing radius.
        this.radius = (this.canvasWidth > this.canvasHeight) ? 
                       this.canvasMiddleY : this.canvasMiddleX;
        this.radius *= this.radiusLen;

        //Clear the canvas.
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        //Get time string to draw.
        var timeString = moment(thisMoment).format("hh:mm:ss.SSS");
        
        //Convert string into integers.
        var timeArray = timeString.split(":");
        var hour = parseInt(timeArray[0]);
        var min = parseInt(timeArray[1]);
        timeArray = timeArray[2].split(".");
        var sec = parseInt(timeArray[0]);
        var mil = parseInt(timeArray[1]);

        //Convert 12 o'clock to 0.
        if(hour === 12) hour = 0;

        //Check if minute ticks are enabled.
        if(!(this.options & HIDE_MINUTE_TICK))
        {
            //Prepare to draw 60 minute ticks.
            thisTheta = 0;

            //Draw the minute ticks.
            for(let i = 0; i < 60; i++)
            {
                this.drawLineAngle(thisTheta, this.minuteTickColor, this.minuteTickWidth, 
                                   this.radius * this.minuteTickLen, this.radius);
                thisTheta += Math.PI / 30;
            }
        }

        //Check if minor hour ticks are enabled.
        if(!(this.options & HIDE_MINOR_TICK))
        {
            //Prepare to draw 12 hour ticks.
            thisTheta = 0;

            //Draw the minor hour ticks.
            for(let i = 0; i < 12; i++)
            {
                this.drawLineAngle(thisTheta, this.minorTickColor, this.minorTickWidth, 
                                   this.radius * this.minorTickLen, this.radius);
                thisTheta += Math.PI / 6;
            }
        }

        //Check if major hour ticks are enabled.
        if(!(this.options & HIDE_MAJOR_TICK))
        {
            //Prepare to draw 4 hour ticks at 3, 6, 9 and 12.
            thisTheta = 0;

            //Draw the major hour ticks.
            for(let i = 0; i < 4; i++)
            {
                this.drawLineAngle(thisTheta, this.majorTickColor, this.majorTickWidth,
                                   this.radius * this.majorTickLen, this.radius);
                thisTheta += Math.PI / 2;
            }
        }

        //Check if the outer ring is enabled.
        if(!(this.options & HIDE_RING))
        {
            //Draw the circle of the clock face.
            this.drawArc(0, 2 * Math.PI, this.radius, this.outerRingColor, this.outerRingWidth);
        }

        //Check if hour hand is enabled
        if(!(this.options & HIDE_HOURS))
        {
            //Calculate the current piece the hour hand is on.
            thisPiece = Math.round(hour * 30 + min / 2);

            //Calculate Current angle of the hour hand.  12 o'clock is at -PI/2.
            thisTheta = -Math.PI / 2  + this.oneDegree * thisPiece;

            //Draw the hour hand.
            this.drawLineAngle(thisTheta, this.hourColor, this.hourWidth,
                               0, this.radius * this.hourLen);
        }

        //Check if minute hand is enabled
        if(!(this.options & HIDE_MINUTES))
        {
            //Calculate the current piece the minute hand is on.
            thisPiece = Math.round(min * 6 + sec / 10);

            //Calculate Current angle of the minute hand.  12 o'clock is at -PI/2.
            thisTheta = -Math.PI / 2  + this.oneDegree * thisPiece;

            //Draw the minute hand.
            this.drawLineAngle(thisTheta, this.minuteColor, this.minuteWidth,
                               0, this.radius * this.minuteLen);
        }

        //Check if second hand is enabled.
        if(!(this.options & HIDE_SECONDS))
        {
            //Calculate the current piece the second hand is on.
            var thisPiece = sec * 6;

            //Check if subseconds are enabled.
            if(this.options & SUBSECONDS)
            {
                thisPiece += Math.round(mil * this.secondConst);
            }

            //Calculate Current angle of the second hand.  12 o'clock is at -PI/2.
            var thisTheta = -Math.PI / 2 + this.oneDegree * thisPiece;

            //Draw the second hand.
            this.drawLineAngle(thisTheta, this.secondColor, this.secondWidth,
                               0, this.radius * this.secondLen);
        }

        //Check if the center is enabled.
        if(!(this.options & HIDE_CENTER))
        {
            //Draw the inner circle the hands attach to.
            this.drawArc(0, 2 * Math.PI, this.centerRad, this.centerColor, this.centerWidth);
        }
    }

    //Draw lines in polar coordinates.  Used for drawing clock hands and ticks.
    drawLineAngle(angle, color, width, rStart, rEnd)
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(this.canvasMiddleX + rStart * Math.cos(angle), 
                        this.canvasMiddleY + rStart * Math.sin(angle));
        this.ctx.lineTo(this.canvasMiddleX + rEnd   * Math.cos(angle),
                        this.canvasMiddleY + rEnd   * Math.sin(angle));
        this.ctx.stroke();
    }

    //Draw arcs in polar coordinates.
    drawArc(startAngle, endAngle, radius, color, width)
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.arc(this.canvasMiddleX, this.canvasMiddleY, radius, startAngle, endAngle);
        this.ctx.stroke();
    }
}

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
var options = SUBSECONDS;
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
        console.log("seconds Remaining: " + secRemaining);

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
