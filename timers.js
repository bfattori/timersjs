(function(G) {
    /**
     * TimersJS
     *
     * Copyright (c) 2013, 2019 Brett Fattori (bfattori@gmail.com)
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     * 2/2019 - Rewritten in ES6, internals exposed, refactored
     */
    const isNode = typeof(process) !== "undefined" && process.title && !G;
    let SystemTimers = isNode ? require('timers') : this, 
        timerPool = [], callbacksPool = [], opaque = 0;

    const STATE = {
        INIT:       Symbol("INIT"),
        RUNNING:    Symbol("RUNNING"),
        PAUSED:     Symbol("PAUSED"),
        DEAD:       Symbol("DEAD")
    };

    function addTimerToPool(timer) {
        timerPool.push(timer);
        opaque++;
        return opaque;
    }

    function removeTimerFromPool(timer) {
        timerPool = timerPool.filter((el) => { return el.id !== timer.id });
    }

    function addCleanupCallback(callback) {
        callbacksPool.push(callback);
    }

    function dispose(obj) {
        if (obj !== undefined && obj !== null) {
            Object.keys(obj).forEach((key) => delete obj[key] );
        }
    }

    SystemTimers.setInterval(function() {
        while (callbacksPool.length > 0) {
            dispose(callbacksPool[0]);
            callbacksPool[0] = undefined;
            callbacksPool.shift();
        }
    }, 500);

    /*
     * Internal Classes --------------------------------------------------------------------
     */
    class Timer {
        constructor(interval, callback) {
            let prototyping = (typeof interval === "undefined");

            this.internal = {
                callback: null,
                systemTimerReference: null,
                systemTimerFunction: null,
                state: STATE.INIT,
                lastTime: Date.now(),
                interval: interval,
                killable: true
            };

            // External state object
            this.state = {};

            if (!prototyping) {
                this.id = addTimerToPool(this);
            }
            
            // Bind the callback
            if (this.shouldRestart()) {
                this.callback(callback);
                this.restart();
            }

            return this;
        }

        shouldRestart() {
            return true;
        }

        state(key, value) {
            if (typeof key === "object")
                this.state = key;
            else if (typeof key === "string" && typeof value === "undefined")
                return this.state[key];
            else if (typeof key === "string" && typeof value !== "undefined")
                this.state[key] = value;
            else
                return this.state;
        }
    
        kill() {
            if (!this.internal.killable)
                return this;
    
            // The JS engine needs to clean up this timer
            addCleanupCallback(this.internal.systemTimerFunction);
            this.cancel();
            removeTimerFromPool(this);
            this.internal.systemTimerReference = null;

            this.internal.state = STATE.DEAD;
            return undefined;
        }
    
        systemTimer(timer) {
            if (timer) {
                this.internal.systemTimerReference = timer;
            }
            return this.internal.systemTimerReference;
        }
    
        isRunning() {
            return this.internal.state === STATE.RUNNING;
        }
    
        cancel() {
            SystemTimers.clearTimeout(this.systemTimer());
            this.internal.systemTimerReference = null;
            this.internal.running = false;
            return this;
        }
    
        pause() {
            this.cancel();
            this.internal.state = STATE.PAUSED;
            return this;
        }
    
        restart() {
            this.cancel();
            if (this.internal.callback !== null) {
                this.systemTimer(SystemTimers.setTimeout(this.callback(), this.interval()));
                this.internal.running = true;
                this.internal.state = STATE.RUNNING;
            }
            return this;
        }
    
        killable(state) {
            if (state !== undefined)
                this.internal.killable = state;
    
            return this.internal.killable;
        }
    
        callback(callback) {
            if (callback) {
                this.setCallback(callback);
            } else {
                if (this.internal.systemTimerFunction === null) {
                    this.internal.systemTimerFunction = function() {
                        let now = Date.now(), delta = now - this.lastTime;
                        this.lastTime = now;
                        if (this.callback) {
                            this.callback.call(this.timer, delta, now);
                        }
                    }.bind({
                        timer: this,
                        lastTime: this.internal.lastTime,
                        callback: this.internal.callback    
                    });
                }
            }
            return this.internal.systemTimerFunction;
        }

        setCallback(callback) {
            this.internal.callback = callback;
            this.internal.systemTimerFunction = null;
            if (this.isRunning()) {
                this.restart();
            }
        }

        interval(interval) {
            if (interval !== undefined) {
                this.cancel();
                this.internal.interval = interval;
            }
            return this.internal.interval;
        }
    
    }

    // ### Private subclasses ------------------------------------------------------------------

    class RepeaterTimer extends Timer {

        setCallback(callback) {
            let internalCallback = function(delta, now) {
                if (this.callbackFunction) {
                    this.callbackFunction.call(this.timer, delta, now);
                }

                this.timer.restart();
            }.bind({
                callbackFunction: callback,
                timer: this
            });
            super.setCallback(internalCallback);            
        }
    }

    class MultiTimer extends Timer {
        constructor (interval, callback, repetitions, completionCallback) {
            super(interval, callback);

            this.internal.completionCallback = completionCallback;
            this.internal.repetitions = repetitions;
            
            this.callback(callback);
            this.restart();
        }

        shouldRestart() {
            return false;
        }

        setCallback(callback) {
            let internalCallback = function(delta, now) {
                if (this.repetitions-- > 0) {
                    this.callbackFunction.call(this.timer, this.totalRepetitions, delta, now);
                    this.totalRepetitions++;
                    this.timer.restart();
                } else {
                    if (this.completionCallback) {
                        this.completionCallback.call(this.timer, delta, now);
                    }
                    this.timer.kill();
                    addCleanupCallback(this);
                }
            }.bind({
                callbackFunction: callback,
                completionCallback: this.internal.completionCallback,
                repetitions: this.internal.repetitions,
                totalRepetitions: 0,
                timer: this
            });
            super.setCallback(internalCallback);
        }
    }

    class OneShotTimer extends Timer { 

        setCallback(callback) {
            let innerCallback = function(delta, now) {
                if (this.callbackFunction) {
                    this.callbackFunction.call(this.timer, delta, now);
                    this.timer.kill();
                    addCleanupCallback(this);
                }
            }.bind({
                callbackFunction: callback,
                timer: this
            });

            super.setCallback(innerCallback);
        }

        restart() {
            if (this.internal.state !== STATE.PAUSED && this._running) {
                return;
            }
    
            super.restart();
        }
    }

    class TriggerTimer extends OneShotTimer { 
        constructor(interval, callback, triggerInterval, triggerCallback) {
            super(interval, callback);

            this.triggerInterval = triggerInterval;
            this.triggerCallback = triggerCallback;

            this.callback(callback);
            this.restart();
        }

        shouldRestart() {
            return false;
        }

        setCallback(callback) {
            let completionCallback = function(delta, now) {
                this.interval.kill();
                this.intervalCompletionCallback.call(this.timer, delta, now);
                addCleanupCallback(this);
            }.bind({
                interval: new RepeaterTimer(this.triggerInterval, this.triggerCallback),
                intervalCompletionCallback: callback,
                timer: this
            });

            super.setCallback(completionCallback);
        }
    }

    /*
     *      PUBLIC API --------------------------------------------------------------------------
     */

    let TimersJS = {

        poolSize: function() {
            // Subtract the class inheritance objects
            return timerPool.length;
        },

        pauseAllTimers: function() {
            timerPool.forEach((timer) => timer.pause());
        },

        restartAllTimers: function() {
            timerPool.forEach((timer) => timer.restart());
        },

        cancelAllTimers: function() {
            timerPool.forEach((timer) => timer.cancel());
        },

        killAllTimers: function() {
            var liveTimers = [];
            while (timerPool.length > 0) {
                var timer = timerPool.shift();
                if (!timer.killable())
                    liveTimers.push(timer);
                else
                    timer.kill();
            }
            timerPool = liveTimers;
        },

        // Export the classes because Open Source
        exports: {
            Timer: Timer,
            RepeaterTimer: RepeaterTimer,
            MultiTimer: MultiTimer,
            OneShotTimer: OneShotTimer,
            TriggerTimer: TriggerTimer,

            addTimerToPool: addTimerToPool,
            removeTimerFromPool: removeTimerFromPool,
            addCleanupCallback: addCleanupCallback
        },

        // TIMER FACTORY --------------------------------------------------------------

        timer: function(interval, callback) {
            return new Timer(interval, callback);
        },

        repeater: function(interval, callback) {
            return new RepeaterTimer(interval, callback);
        },

        multi: function(interval, repetitions, callback, completionCallback) {
            return new MultiTimer(interval, callback, repetitions, completionCallback);
        },

        oneShot: function(interval, callback) {
            return new OneShotTimer(interval, callback);
        },

        trigger: function(interval, callback, triggerRate, triggerCallback) {
            return new TriggerTimer(interval, callback, triggerRate, triggerCallback);
        }
    };

    Object.freeze(TimersJS.exports);
    
    if (isNode) {
        module.exports = TimersJS;
    } else {
        G.TimersJS = TimersJS;
    }

})();