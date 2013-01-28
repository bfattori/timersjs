timersjs
========

Simple JavaScript timer factory with multiple types of timer objects.

Usage:

var timer = TimersJS.timer(100, function() {
   console.log("This is output after 100ms");
});

The function is given the timer itself as the context so within the function, "this" refers
to the timer.  A timer can be turned into an interval simply by calling the timer's restart() method:

var timer = TimersJS.timer(250, function() {
   console.log("This is output every 250ms");
   this.restart();
});

This could also be accomplished with:

var repeater = TimersJS.repeater(250, function() {
   console.log("This is output every 250ms");
});


It's possible to use this functionality to allow a timer to kill itself when something completes:

TimersJS.timer(50, function() {
   if (ajaxHasReturned) {
      this.kill();
   } else {
      this.restart();
   }
});


There are other types of timers, a one-shot which self-kills when it's done:

TimersJS.oneShot(500, function() {
   console.log("This is called when the timeout is complete");
});

These is a timer which will repeat a certain number of timer before it self destructs:

TimersJS.multi(250, 8, function(repetition) {
   console.log("This is repetition " + repetition);
}, function() {
   console.log("The multi timer is complete");
});

