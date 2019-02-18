# timersjs

A tiny JavaScript timer library

Originally extracted from a game engine I wrote, I found these timers extremely useful elsewhere. It provides five little timer abstractions which make using timers in Javascript a little easier. Everything uses `setTimeout` to function because `setInterval` is inherently unstable for repetition. Additionally, the global timer functions are not modified in any way. This is all self-contained.

A `Timer` is a simple JavaScript timeout with some added functionality. As long as the timer instance exists, it can be restarted and perform the action again. You can also change the interval when the timer is not running.

_This version is written in Ecmascript 6 and will not work in unsupported environments. For a version compatible with ES5 and earlier, try:_ https://npmjs.org/packages/timersjs_compat

```javascript
// Create the timer instance
let timer = TimersJS.timer(1000, function() {
    alert("TimerJS");
});
// expect: "TimerJS" after one second

// Change the interval to 5000 and restart
timer.interval(2000).restart();
// expect: "TimerJS" after five seconds

// When done with a timer, kill it explicitly
timer.kill();

```

## Installation

```
npm install timersjs
```

## Usage:

### Browser
```
<script src="path/to/timers.js" type="application/javascript"></script>
```

### Node
```javascript
const TimerJS = require('timerjs');
```

A simple timer:

```javascript
let timer = TimersJS.timer(100, function(delta, now) 
   console.log(`This is output after 100ms, the current time is ${now}ms`);
);
```

_Note: Don't use arrow functions, and instead use anonymous functions. Unexpected results can occur otherwise._

The function is given the timer as the context so within the function, `this` refers to the timer.  A timer can be turned into an interval simply by calling the timer's `restart()` method:

```javascript
let timer = TimersJS.timer(250, function() {
   console.log("This is output every 250ms");
   this.restart();
});
```

Some syntactic sugar and you don't have to restart it yourself:

```javascript
let repeater = TimersJS.repeater(250, function(delta) {
   console.log(`This is output every 250ms, time since last execution: ${delta}ms`);
});
```

Timers are system objects that need to be maintained. When you are done with a timer, always clean it up. Within a timer, it is possible to achieve this by calling the `kill()` method of the timer.

```javascript
TimersJS.timer(50, function() {
   if (ajaxHasReturned()) {
      this.kill();
   } else {
      this.restart();
   }
});
```

This form of a timer will automatically kill itself when it completes so you don't have to remember to kill it:

```javascript
TimersJS.oneShot(500, function() {
   console.log("This is called when the timeout is complete");
});
```

This is a timer which will repeat a certain number of times before it self destructs:

```javascript
// Repeat every 250 ms, 8 times in total (2 seconds minimum)
TimersJS.multi(250, 8, function(repetition) {
   console.log(`This is repetition #${repetition}`);
}, function() {
   console.log("The multi timer is complete");
});
```

Finally, this form runs a `repeater` internally:

```javascript
// Over a period of 5 seconds, run the repeater as often as possible with a minimum delay of half a second
TimersJS.trigger(5000, function() {
    console.log("The trigger is complete");
}, 500, function(now, delta) {
    console.log(``Triggered @ ${delta}ms``);
});
```

You may wonder why have the trigger and the multi?  Well, the multi is triggered a specific number of times with the same interval between callbacks.  It is guaranteed to call back the number of times you want it. The trigger. on the other hand, will trigger as often as it can in the time allotted.

# License
```
Copyright 2013 Brett Fattori

Permission is hereby granted, free of charge, to any person obtaining a copy of this 
software and associated documentation files (the "Software"), to deal in the Software 
without restriction, including without limitation the rights to use, copy, modify, 
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to the following 
conditions:

The above copyright notice and this permission notice shall be included in all copies 
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```