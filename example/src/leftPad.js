export default function leftPad(str = '', pad = 0) {
    const padNeeded = Math.max(pad - str.length, 0);

    return Array(padNeeded + 1).join(' ') + str;
}
