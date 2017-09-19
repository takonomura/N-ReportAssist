'use strict';

/**
 * Format duration to HH:MM:SS.
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor(seconds % 3600 / 60);
    seconds = seconds % 60;

    function formatNumber(n) {
        return String(n).padStart(2, '0');
    }
    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
}

/**
 * @param {Element} element - Element for video description. 
 * @returns {number} Video duration in seconds.
 */
function parseDuration(element) {
    let units = element.textContent
        .normalize('NFKC').replace(/[\s]+/g, ' ')
        .match(/動画時間 (?:([\d]+):)?([\d]+):([\d]+)/);
    if (units === null) {
        console.warn('Cannot find duration for the video:', element);
        return 0;
    }

    let hours = Number(units[1]) || 0;
    let minutes = Number(units[2]) || 0;
    let seconds = Number(units[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * @returns {Element}
 */
function getBaseElement() {
    return document.getElementById('report_unit_movie') || document.getElementById('result_unit_movie');
}

/**
 * Write duration to title element.
 *
 * @param {Element} element - Title element.
 * @param {number} duration - Duration in seconds.
 */
function writeDuration(element, duration) {
    if (element == null || duration <= 0) {
        return;
    }
    element.textContent += ` (${formatDuration(duration)})`;
}

function init() {
    let baseElement = getBaseElement();

    let mainTitleElement = baseElement.getElementsByTagName('h1')[0];
    let totalDuration = 0;

    let sectionTitleElement = null;
    let sectionDuration = 0;

    for (let element of baseElement.childNodes) {
        if (element instanceof HTMLHeadingElement && element.tagName === 'H2') {
            writeDuration(sectionTitleElement, sectionDuration);
            sectionTitleElement = element;
            sectionDuration = 0;
        }
        if (element instanceof HTMLDListElement && element.classList.contains('list')) {
            let duration = parseDuration(element);
            totalDuration += duration;
            sectionDuration += duration;
        }
    }

    writeDuration(sectionTitleElement, sectionDuration);
    writeDuration(mainTitleElement, totalDuration);
}

init();
