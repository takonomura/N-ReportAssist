'use strict';

const DEADLINE_NAMES = ['5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/**
 * Returns deadline for a report.
 *
 * @param {string} subjectName
 * @param {number} reportIndex
 * @return {number} - Index for deadline.
 */
function getReportDeadline(subjectName, reportIndex) {
  const PATTERN_12 = [0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7];
  const PATTERN_9 = [0, 1, 2, 3, 4, 5, 6, 6, 7];
  const PATTERN_8 = [0, 1, 2, 3, 4, 5, 6, 7];
  const PATTERN_6A = [0, 1, 2, 5, 6, 7];
  const PATTERN_6B = [1, 2, 3, 5, 6, 7];
  const PATTERN_4 = [1, 3, 5, 7];
  const PATTERN_3 = [2, 5, 7]
  const PATTERN_2 = [2, 7];
  const PATTERN_1 = [7];
  const DEADLINE = {
    '国語総合': PATTERN_12,
    '国語表現': PATTERN_9,
    '現代文A': PATTERN_6A,
    '現代文B': PATTERN_12,
    '古典A': PATTERN_6A,
    '世界史B': PATTERN_12,
    '日本史B': PATTERN_12,
    '地理B': PATTERN_12,
    '現代社会': PATTERN_6A,
    '倫理': PATTERN_6A,
    '政治・経済': PATTERN_6A,
    '数学I': PATTERN_9,
    '数学II': PATTERN_12,
    '数学A': PATTERN_6A,
    '数学B': PATTERN_6A,
    '科学と人間生活': PATTERN_6A,
    '物理基礎': PATTERN_6A,
    '化学基礎': PATTERN_6A,
    '生物基礎': PATTERN_6A,
    '地学基礎': PATTERN_6A,
    '体育I': PATTERN_2,
    '体育II': PATTERN_3,
    '体育III': PATTERN_2,
    '保健': PATTERN_6B,
    '美術I': PATTERN_6B,
    'コミュニケーション英語I': PATTERN_9,
    'コミュニケーション英語II': PATTERN_12,
    '英語表現I': PATTERN_6A,
    '英語会話': PATTERN_6A,
    '家庭基礎': PATTERN_4,
    '家庭総合': PATTERN_8,
    '社会と情報': PATTERN_4,
    '情報の科学': PATTERN_4,
    '総合的な学習I': PATTERN_1,
    '総合的な学習II': PATTERN_1,
    '総合的な学習III': PATTERN_1,
  };
  if (!DEADLINE[subjectName]) {
    console.warn('Unknown subject name:', subjectName);
    return -1;
  }
  if (DEADLINE[subjectName].length <= reportIndex) {
    console.warn('Invalid report index:', subjectName, reportIndex);
    return -1;
  }
  return DEADLINE[subjectName][reportIndex];
}

/**
 * @return {NodeList}
 */
function getSubjectElements() {
  return document.querySelectorAll('.list > li');
}

/**
 * @param {Element} subjectElement
 * @return {NodeList}
 */
function getReportElements(subjectElement) {
  return subjectElement.querySelectorAll('ul > li');
}

/**
 * Returns normalized name for subject, or report.
 *
 * @param {Element} element
 * @return {string}
 */
function getName(element) {
  return getNameElement(element).textContent.normalize('NFKC');
}

/**
 * Returns name element for subject, or report.
 *
 * @param {Element} element
 * @return {Element}
 */
function getNameElement(element) {
  return element.getElementsByTagName('a')[0];
}

/**
 * Checks the report is completed.
 *
 * @param {Element} element
 * @return {boolean}
 */
function isReportCompleted(element) {
  return element.getElementsByClassName('complete').length !== 0;
}

/**
 * Add element to page.
 *
 * @param {Element} element 
 */
function addControlElement(element) {
  let listElement = document.getElementsByClassName('list')[0];
  listElement.parentNode.insertBefore(element, listElement);
}

/**
 * Show reports for subject.
 *
 * @param {Element} subjectElement 
 */
function open(subjectElement) {
  if (subjectElement.querySelector('ul').style.display !== 'none') {
    return;
  }
  getNameElement(subjectElement).click();
}

/**
 * Open all subjects nearing deadline.
 */
function openNearDeadline() {
  Array.from(getSubjectElements())
    .filter(e => e.classList.contains('near-deadline'))
    .forEach(e => open(e));
}

/**
 * Open all subjects
 */
function openAll() {
  Array.from(getSubjectElements()).forEach(e => open(e));
}

/**
 * @param {string} text - Message
 * @returns {HTMLButtonElement}
 */
function createButton(text) {
  let element = document.createElement('button');
  element.classList.add('practicable');
  element.textContent = text;
  return element;
}

/**
 * Show buttons to open subjects.
 */
function showOpenButtons() {
  let openAllButton = createButton('全て開く');
  openAllButton.addEventListener('click', openAll);
  addControlElement(openAllButton);

  let openNearDeadlineButton = createButton('期限が近いものを開く');
  openNearDeadlineButton.addEventListener('click', openNearDeadline);
  addControlElement(openNearDeadlineButton);
}

/**
 * Show deadline for report before report-name.
 */
function showDeadline() {
  for (let subjectElement of getSubjectElements()) {
    let subjectName = getName(subjectElement);
    let reportElements = getReportElements(subjectElement);
    for (let reportIndex = 0; reportIndex < reportElements.length; reportIndex++) {
      let reportElement = reportElements[reportIndex];
      let reportNameElement = getNameElement(reportElement);
      let reportDeadline = getReportDeadline(subjectName, reportIndex);
      if (reportDeadline < 0) {
        continue;
      }
      reportNameElement.textContent = DEADLINE_NAMES[reportDeadline] + ': ' + reportNameElement.textContent;
    }
  }
}

/**
 * Update background color for nearing deadline.
 *
 * @param {number} current - Index for deadline.
 */
function updateColors(current) {
  let subjectElements = getSubjectElements();
  for (let subjectIndex = 0; subjectIndex < subjectElements.length; subjectIndex++) {
    let subjectElement = subjectElements[subjectIndex];
    let subjectName = getName(subjectElement);

    let completed = true;

    let reportElements = getReportElements(subjectElement);
    for (let reportIndex = 0; reportIndex < reportElements.length; reportIndex++) {
      let reportElement = reportElements[reportIndex];
      let reportDeadline = getReportDeadline(subjectName, reportIndex);
      let reportCompleted = isReportCompleted(reportElement) || reportDeadline > current;
      if (reportCompleted) {
        reportElement.classList.remove('near-deadline');
      } else {
        completed = false;
        reportElement.classList.add('near-deadline');
      }
    }

    if (completed) {
      subjectElement.classList.remove('near-deadline');
    } else {
      subjectElement.classList.add('near-deadline');
    }
  }
}

/**
 * Show picker for selecting deadline to highlight.
 *
 * @param {number} defaultIndex 
 */
function showDeadlinePicker(defaultIndex) {
  let selectElement = document.createElement('select');
  for (let i = 0; i < DEADLINE_NAMES.length; i++) {
    let optionElement = document.createElement('option');
    optionElement.value = i.toString(10);
    optionElement.textContent = DEADLINE_NAMES[i];
    if (i === defaultIndex) {
      optionElement.selected = true;
      updateColors(i);
    }
    selectElement.appendChild(optionElement);
  }
  selectElement.addEventListener('change', function () {
    updateColors(this.selectedIndex);
  });
  addControlElement(selectElement);
}

/**
 * @param {Date} date
 * @returns {number} Index for deadline.
 */
function getNextDeadline(date) {
  let deadline = date.getMonth() - 4;

  if (date.getDate() > 25) {
    deadline++;
  }

  if (deadline < 0 || deadline > 7) {
    return 7;
  }
  return deadline;
}

showDeadline();
showDeadlinePicker(getNextDeadline(new Date()));
showOpenButtons();
