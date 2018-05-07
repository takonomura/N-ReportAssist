function getNumber(v) {
  return Number(getText(v).replace(/[^0-9]/, ''));
}

function getText(v) {
  if (v instanceof Element) {
    v = v.textContent;
  }
  return v.trim();
}

function parseDeadline(s) {
  const parts = s.split('/');
  return {
    month: getNumber(parts[0]),
    date: getNumber(parts[1]),
  };
}

function getResult() {
  const rows = Array.from(document.querySelectorAll('#result_table tr'));
  const subjects = [];

  let currentSubject;
  let rowIndex = 0;
  for (const row of rows) {
    if (!row.classList.contains('subject_1st_row') && !row.classList.contains('subject_2st_row')) {
      continue;
    }

    const columns = Array.from(row.getElementsByTagName('td'));

    if (rowIndex % 3 === 0) {
      const nameElement = columns.shift();
      currentSubject = {
        name: getText(nameElement),
        nameElement: nameElement,
        credits: getNumber(columns.shift()),
        reports: [],
      };
      subjects.push(currentSubject);
    }

    columns.forEach((column, index) => {
      if (getText(column) === '-') {
        return;
      }

      let report = currentSubject.reports[index];
      if (!report) {
        report = {};
        currentSubject.reports[index] = report;
      }

      switch(rowIndex % 3) {
        case 0:
          report.deadline = parseDeadline(getText(column));
          report.deadlineElement = column;
          break;
        case 1:
          report.progress = getNumber(column);
          report.progressElement = column;
          break;
        case 2:
          report.score = getNumber(column);
          report.scoreElement = column;
          break;
        default:
      }
    });

    rowIndex++;
  }
  return subjects;
}

function getState(deadline) {
  const today = new Date();
  const currentMonth = (today.getMonth() + 9) % 12;
  const currentDate = today.getDate();
  const deadlineMonth = (deadline.month + 8) % 12;
  const deadlineDate = deadline.date;

  if (deadlineMonth < currentMonth) {
    return 'ended';
  }
  if (deadlineMonth === currentMonth) {
    if (deadlineDate < currentDate) {
      return 'ended';
    }
    return 'current';
  }
  if (deadlineMonth === (currentMonth + 1) && deadlineDate <= currentDate) {
    return 'current';
  }
  return 'future';
}

function updateColors(result) {
  for (const subject of result) {
    for (const report of subject.reports) {
      if (report.progress === 100) {
        report.deadlineElement.classList.add('n-report-assist-complete');
        report.progressElement.classList.add('n-report-assist-complete');
        continue;
      }
      const state = getState(report.deadline);
      report.deadlineElement.classList.add(`n-report-assist-${state}`);
      report.progressElement.classList.add(`n-report-assist-${state}`);
    }
  }
}

function getRemainDays(deadline) {
  const today = new Date();

  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineUTC = Date.UTC(today.getFullYear(), deadline.month - 1, deadline.date);

  return Math.floor((deadlineUTC - todayUTC) / (1000 * 60 * 60 * 24));
}

function showAdditionalInfo(result) {
  let currentReports = 0;
  let currentFinishedReports = 0;
  let currentProgress = 0;
  let nextDeadline;
  let overdueReports = 0;

  result.forEach(subject => subject.reports.forEach(report => {
    const state = getState(report.deadline);
    if (state === 'current') {
      currentReports++;
      if (report.progress === 100) {
        currentFinishedReports++;
      }
      currentProgress += report.progress;
      nextDeadline = report.deadline;
    }
    if (state === 'ended' && report.progress != 100) {
      overdueReports++;
    }
  }));

  const lines = [
    `次の提出期日まで: ${getRemainDays(nextDeadline)} 日間`,
    `今月のレポート: ${currentReports} 個 (${currentFinishedReports} 個完了)`,
    `今月の進捗率: ${(currentProgress/currentReports).toFixed(2)} %`,
    `期日を過ぎたレポート: ${overdueReports} 個`,
  ];

  const textElement = document.createElement('pre');
  textElement.textContent = lines.join('\n');

  const nextElement = document.getElementById('result_table');
  nextElement.parentNode.insertBefore(textElement, nextElement);
}

function setLink(element, href) {
  const linkElement = document.createElement('a');
  linkElement.href = href;
  while (element.hasChildNodes()) {
    linkElement.appendChild(element.removeChild(element.firstChild));
  }
  element.appendChild(linkElement);
}

function appendLinks(result) {
  const courses = {
    '国語表現(東京書籍版)': { id: 365, chapters: [6244, 6245, 6246, 6247, 6248, 6249, 6250, 6251, 6252] },
    '現代文Ａ(東京書籍版)': { id: 368, chapters: [6253, 6254, 6255, 6256, 6257, 6258] },
    '地理Ｂ(東京書籍版)': { id: 383, chapters: [6301, 6302, 6303, 6304, 6305, 6306, 6307, 6308, 6309, 6310, 6311, 6312] },
    '倫理(東京書籍版)': { id: 389, chapters: [6319, 6320, 6321, 6322, 6323, 6324] },
    '数学Ａ(東京書籍版)': { id: 401, chapters: [6352, 6353, 6354, 6355, 6356, 6357] },
    '生物基礎(東京書籍版)': { id: 416, chapters: [6382, 6383, 6384, 6385, 6386, 6387] },
    '体育Ⅱ(東京書籍版)': { id: 425, chapters: [6396, 6397, 6398] },
    '保健(東京書籍版)': { id: 431, chapters: [6401, 6402, 6403, 6404, 6405, 6406] },
    '英語会話(東京書籍版)': { id: 446, chapters: [6440, 6441, 6442, 6443, 6444, 6445] },
    '社会と情報(東京書籍版)': { id: 455, chapters: [6458, 6459, 6460, 6461] },
    '総合的な学習Ⅱ(東京書籍版)': { id: 464, chapters: [6467] },
  };
  result.forEach(subject => {
    const course = courses[subject.name];
    if (!course) {
      console.warn(`No course data for "${subject.name}"`);
      return;
    }
    setLink(subject.nameElement, `https://www.nnn.ed.nico/courses/${course.id}/chapters`);
    subject.reports.forEach((report, i) => {
      const chapter = course.chapters[i]
      if (!chapter) {
        console.warn(`No chapter data for report "${subject.name}" #${i}`);
        return;
      }
      setLink(report.progressElement, `https://www.nnn.ed.nico/courses/${course.id}/chapters/${chapter}`);
    });
  });
}

const result = getResult();
updateColors(result);
showAdditionalInfo(result);
appendLinks(result);
