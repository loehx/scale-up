const { memoize, result } = require('lodash');
var moment = require('moment');
const { ensure } = require('./assertion');
const _ = require('lodash');
const prettyMilliseconds = require('pretty-ms');
const { args } = require('commander');
const { transpose } = require("lodash-transpose");

const util = module.exports = {

    oneHot(value, range, ignoreOverflow, arraySize) {
        const [from, to] = range;
        const r = new Array(arraySize ? arraySize : (to - from + 1)).fill(0);
        const stepSize = (to - from + 1) / r.length;
        console.log(value, range, ignoreOverflow, arraySize, 'stepSize:', stepSize);

        if (typeof value === 'undefined') {
            throw "util.oneHot(..) failed: value is undefined";
        }

        if (ignoreOverflow && (value > to || value < from)) {
            return r;
        }

        if (value > to) {
            throw "util.oneHot(..) failed: value " + value + " is too big to fit in range: [" + range.join(', ') + ']';
        }
        if (value < from) {
            throw "util.oneHot(..) failed: value " + value + " is too small to fit in range: [" + range.join(', ') + ']';
        }
        const i = Math.floor((value - from) / stepSize);
        r[i] = 1;
        return r;
    },

    reverseOneHot(prediction, range, resultCount = 5) {
        const [from, to] = range;
        const result = [];
        const stepSize = (to - from) / prediction.length;

        for (let i = 0; i < prediction.length; i++) {
            const possibility = util.round(prediction[i], 3);
            const a = from + (stepSize * i);
            const b = a + stepSize;
            if (possibility > 0) {
                result.push({
                    r: [a, b],
                    p: possibility
                });
            }
        }

        result.sort((a,b) => b.p - a.p);
        return result.slice(0, resultCount);
    },

    scaleMinMax(arr, minusOneToOne) {
        let min = Infinity;
        let max = -Infinity;
        const len = arr.length;
        for (let i = 0; i < len; i++) {
            const n = arr[i];
            if (n < min) {
                min = n;
            }
            if (n > max) {
                max = n;
            }
        }

        if (max === min) {
            return new Array(arr.length).fill(max);
        }
        else if (max === 1 && min === 0) {
            return arr; // no need to rescale
        }
        
        if (minusOneToOne && min < 0) {
            const r1 = (max - min);
            const ratio = Math.abs(max) / Math.abs(min);
            const range = (max - min) / ratio;
            const shift = Math.abs(ratio / max);
            //console.log('minusOneToOne', {min, max, r1, ratio, shift, range})

            return arr.map(a => util.round((a - min) / range - (shift), 6));
        }
        const range = max - min;
        return arr.map(a => util.round((a - min) / range, 6));
    },

    scaleByMean(arr, period) {
        const result = new Array(arr.length);
        result.length = 0;

        period = Math.min(period, arr.length);

        result.push(0);

        for (let i = 1; i < arr.length; i++) {
            const val = arr[i];
            
            let avg = 0;
            let counter = 0;

            const pStart = Math.max(i - period, 1);
            const pEnd = i;

            for (let p = pStart; p <= pEnd; p++) {
                const v = arr[p];
                avg += v;
                counter++;
            }

            avg = avg / counter;
            //console.log(val, avg, pStart, pEnd);

            result.push(util.round(val - avg, 6));

        }
        return result;
    },

    movingAverage(arr, period) {
        const result = new Array(arr.length);
        result.length = 0;

        period = Math.min(period, arr.length);

        result.push(arr[0]);

        for (let i = 1; i < arr.length; i++) {
            let avg = 0;
            let counter = 0;

            const pStart = Math.max(i - period, 1);
            const pEnd = i;

            for (let p = pStart; p <= pEnd; p++) {
                const v = arr[p];
                avg += v;
                counter++;
            }

            avg = avg / counter;
            result.push(util.round(avg, 6));
        }
        return result;
    },

    calculateMax(arr, period) {
        const result = new Array(arr.length);
        result.length = 0;

        period = Math.min(period, arr.length);

        result.push(arr[0]);

        for (let i = 1; i < arr.length; i++) {
            let max = -Infinity;

            const pStart = Math.max(i - period, 1);
            const pEnd = i;

            for (let p = pStart; p <= pEnd; p++) {
                const v = arr[p];
                if (v > max) {
                    max = v;
                }
            }

            result.push(util.round(max, 6));
        }
        return result;
    },

    calculateMin(arr, period) {
        const result = new Array(arr.length);
        result.length = 0;

        period = Math.min(period, arr.length);

        result.push(arr[0]);

        for (let i = 1; i < arr.length; i++) {
            let min = Infinity;

            const pStart = Math.max(i - period, 1);
            const pEnd = i;

            for (let p = pStart; p <= pEnd; p++) {
                const v = arr[p];
                if (v < min) {
                    min = v;
                }
            }

            result.push(util.round(min, 6));
        }
        return result;
    },

    calculateProfitability(arr, period) {
        const result = new Array(arr.length);
        result.length = 0;

        period = Math.min(period, arr.length);

        for (let i = 0; i < arr.length; i++) {
            let profitability = 0;
            const current = arr[i];
            const pStart = i;
            const pEnd = Math.min(i + period, arr.length - 1);
            const count = pEnd - pStart;

            for (let p = pStart; p <= pEnd; p++) {
                const v = arr[p];
                if (v > current) {
                    profitability += 1;
                }
            }

            result.push(profitability === 0 ? profitability : util.round(profitability / count, 6));
        }
        return result;
    },

    scaleByMax(arr, period) {
        const result = new Array(arr.length);
        result.length = 0;

        period = Math.min(period, arr.length);

        result.push(arr[0]);

        for (let i = 1; i < arr.length; i++) {
            let max = 0;
            let counter = 0;
            let val = arr[i];

            const pStart = Math.max(i - period, 1);
            const pEnd = i;

            for (let p = pStart; p <= pEnd; p++) {
                const v = arr[p];
                if (v > max) {
                    max = v;
                }
            }

            result.push(util.round(max - val, 6));
        }
        return result;
    },

    difference(arr, relation) {
        const result = new Array(arr.length);
        result.length = 0;

        for (let i = 1; i < arr.length; i++) {
            const val = arr[i];
            const rel = relation[i];

            result.push(val - rel);
        }

        return result;
    },

    reduceSpikes(arr, factor = .2) {
        arr = util.scaleMinMax(arr)
        const avg = util.avg(arr);
        const havg = util.avg(arr.filter(c => c > avg));
        const lavg = util.avg(arr.filter(c => c < avg));
        const maxavg = havg + (havg - avg);
        const minavg = lavg - (avg - lavg);
    
        return arr.map(v => {
            if (v > maxavg) {
                return (v - maxavg) * factor + maxavg;
            }
            if (v < minavg) {
                return (v - minavg) * factor + minavg;
            }
            return v;
        })
    },

    // scaleByMean(arr, period) {
    //     const result = new Array(arr.length);
    //     result.length = 0;

    //     period = Math.min(period, arr.length);

    //     result.push(0);

    //     for (let i = 1; i < arr.length; i++) {
    //         const val = arr[i];
            
    //         let avg = 0;
    //         let max = (arr.length - 1);
    //         let forecast = 0;
    //         let counter = 0;

    //         const pStart = Math.max(i - period, 1);
    //         const pEnd = i;

    //         console.log(i, period, pEnd - pStart, pStart, pEnd);
    //         for (let p = pStart; p < pEnd; p++) {
    //             const v = arr[p];
    //             const pre = arr[p - 1];
    //             const progress = v - pre;
    //             avg += progress;
    //             counter++;
    //         }

    //         avg = avg / counter;
    //         forecast = arr[i - 1] + avg;

    //         result.push(val - forecast);

    //     }
    //     return result;
    // },

    halfLife(arr, multiplier = .5) {
        const clone = arr.slice();
        for (let i = 1; i < clone.length; i++) {
            const val = clone[i];
            if (val === 0) {
                const prev = clone[i - 1];
                if (prev > 0) {
                    const newVal = util.round(prev * multiplier, 6);
                    clone[i] = prev === newVal ? 0 : newVal;
                }
            }
        }
        return clone;
    },

    transpose(arr) {
        return transpose(arr);
    },

    range(start, end, step = 1) {
        const result = new Array();
        for (let i = start; i <= end; i += step) {
            result.push(util.round(i, 10));
        }
        return result;
    },

    sumBy(args, fn) {
        ensure(args);
        let sum = 0;
        for (let i = 0; i < args.length; i++) {
            sum += fn(args[i]);
        }
        return util.round(sum, 10);
    },

    avg(args) {
        ensure(args);
        let avg = 0;
        for (let i = 0; i < args.length; i++) {
            avg += args[i]/args.length;
        }
        return util.round(avg, 10);
    },

    avgBy(args, fn) {
        ensure(args);
        let avg = 0;
        for (let i = 0; i < args.length; i++) {
            avg += fn(args[i])/args.length;
        }
        return util.round(avg, 10);
    },

    min(args) {
        return this.minBy(args, d => d);
    },

    minBy(args, fn) {
        ensure(args, Array);
        let min = Infinity;
        for (let i = 0; i < args.length; i++) {
            const n = fn(args[i]);
            if (n < min) {
                min = n;
            }
        }
        return min;
    },

    max(args) {
        return this.maxBy(args, d => d);
    },

    maxBy(args, fn) {
        ensure(args, Array);
        let max = -Infinity;
        for (let i = 0; i < args.length; i++) {
            const n = fn(args[i]);
            if (n > max) {
                max = n;
            }
        }
        return max;
    },

    memoize(fn) {
        return _.memoize(fn, (...a) => new Array(a).join('_'));
    },

    round(n, precision = 0) {
        const res = _.round(n, precision);
        if (isNaN(res)) {
            return n;
        }
        return res;
    },

    timeout(milliseconds) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, milliseconds);
        });
    },

    crossJoinByProps(obj) {

        let result = [{}]; 

        for (const key in obj) {
            if (Object.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (Array.isArray(value)) {
                    const newResult = new Array(result.length * value.length);
                    newResult.length = 0;
                    value.forEach(v => {
                        result.forEach(r => {
                            newResult.push({
                                ...r,
                                [key]: v
                            });
                        });
                    })
                    result = newResult;
                }
                else {
                    result.forEach(r => r[key] = value);
                }
            }
        }

        return result;
    },

    crossJoinArray(arr, func) {
        const result = [];
        func = func || ((a,b) => [a,b]);
        for (let a = 0; a < arr.length; a++) {
            for (let b = 0; b < arr.length; b++) {
                if (a === b) {
                    continue;
                }
                result.push(func(arr[a], arr[b]));
            }
        }
        return result;
    },

    humanizeDuration(from, to) {
        const ms = (to ?? (from * 2)) - from;
        if (!isFinite(ms)) {
            return 'infinite';
        }
        return prettyMilliseconds(ms, {
            compact: true
        })
    },

    fibonacciSequence(max) {
        const seq = [];
        let pre = 0;
        for(let i = 1; i <= max; i += pre) {
            pre = i - pre;
            seq.push(i);
        }
        return seq;
    },

    exponentialSequence(max, multiplier = 2) {
        const seq = [];
        for(let i = 1; i <= max; i *= multiplier) {
            const val = Math.round(i);
            if (seq[seq.length - 1] !== val) {
                seq.push(val);
            }
        }
        return seq;
    },

    flatten(...args) {
        return _.flatten(...args);
    },

    toShortString(obj) {
        return Object.keys(obj).map(key => key + ':' + JSON.stringify(obj[key])).join(' ');
    },

    newArray(size, fill) {
        const arr = new Array(size);
        arr.length = 0;
        if (typeof fill !== 'undefined') {
            arr.fill(fill);
        }
        return arr;
    },

    getExamples(arr, n) {
        if (arr.length <= n) {
            return arr;
        }
        const a = Math.round(arr.length / n);
        const examples = arr.filter((k,i) => i % a === 0);
        examples.push(arr[arr.length - 1]);
        return examples;
    }
};