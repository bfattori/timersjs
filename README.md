# timersjs

A tiny JavaScript timer library

This library was extracted from a game engine I wrote several years back.  It provides five little timer abstractions which make using timers in Javascript a little easier.

## Installation

```
npm install timersjs
```

## Usage:

```javascript
let timer = TimersJS.timer(100, (delta, now) => 
   console.log(`This is output after 100ms, the current time is ${now}ms`);
);
```

The function is given the timer as the context so within the function, `this` refers
to the timer.  A timer can be turned into an interval simply by calling the timer's restart() method:

```javascript
let timer = TimersJS.timer(250, () => {
   console.log("This is output every 250ms");
   this.restart();
});
```

This simple construct is implemented for you as:

```javascript
let repeater = TimersJS.repeater(250, (delta) => {
   console.log(`This is output every 250ms, time since last execution: ${delta}ms`);
});
```

It's possible to use the following functionality to kill the timer when something completes:

```javascript
TimersJS.timer(50, () => {
   if (ajaxHasReturned()) {
      this.kill();
   } else {
      this.restart();
   }
});
```

There are other types of timers, a one-shot which self-kills when it's done:

```javascript
TimersJS.oneShot(500, () => {
   console.log("This is called when the timeout is complete");
});
```

This is a timer which will repeat a certain number of times before it self destructs:

```javascript
TimersJS.multi(250, 8, (repetition) => {
   console.log(`This is repetition #${repetition}`);
}, function() {
   console.log("The multi timer is complete");
});
```

Finally, this is a timer which will run a repeater internally:

```javascript
TimersJS.trigger(5000, () => {
    console.log("The trigger is complete");
}, 500, function(now, delta) {
    console.log(``Triggered @ ${delta}ms``);
});
```

You may wonder why have the trigger and the multi?  Well, the multi is triggered a specific number of times with the same interval between callbacks.  It is guaranteed to call back the number of times you want it. The trigger. on the other hand, will trigger as often as it can in the time allotted.

# License
```
Copyright 2013 Brett Fattori

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```