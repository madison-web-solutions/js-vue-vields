
const padZeros = function (str: string | number, minLen: number): string {
    str = String(str);
    while (str.length < minLen) {
        str = '0' + str;
    }
    return str;
};

export const timeParse = function(input: string | undefined | null): number | undefined {
    if (input == null || input === '') {
        return undefined;
    }
    // parse the string input
    input = input.toLowerCase().replace(/\s/g, '').replace(/[\.,]/g, ':');
    const res1 = /^(\d\d)(\d\d)$/.exec(input);
    const res2 = /^(\d+):(\d+)(:(\d+))?$/.exec(input);
    let hours: number = 0;
    let mins: number = 0;
    let secs: number = 0;
    if (res1) {
        hours = parseInt(res1[1], 10);
        mins = parseInt(res1[2], 10);
    } else if (res2) {
        hours = parseInt(res2[1], 10);
        mins = parseInt(res2[2], 10);
        secs = (res2[4] == null ? 0 : parseInt(res2[4], 10));
    } else {
        return undefined;
    }
    return secs + (mins * 60) + (hours * 60 * 60);
};

export const timeSplit = function(secondsSinceMidnight: number): [hours: number, mins: number, secs: number] {
    // wrap out of range secs, mins and hours
    let secs: number;
    let mins: number;
    let hours: number;
    const quotientAndRemainder = (a: number, b: number): [quotient: number, remainder: number] => {
        const q = (a < 0) ? -Math.ceil(-a / b) : Math.floor(a / b);
        const r = a - (b * q);
        return [q, r];
    };
    [mins, secs] = quotientAndRemainder(secondsSinceMidnight, 60);
    [hours, mins] = quotientAndRemainder(mins, 60);
    [,hours] = quotientAndRemainder(hours, 24);
    return [hours, mins, secs];
};

export const timeFormat = function(hours: number, mins: number, secs?: number | null | undefined) {
    var parts = [
        padZeros(hours, 2),
        padZeros(mins, 2)
    ];
    if (secs != null) {
        parts.push(padZeros(secs, 2));
    }
    return parts.join(':');
};
