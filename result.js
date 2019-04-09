function getNumber(v) {
  return Number(getText(v).replace(/[^0-9]/g, ''));
}

function getText(v) {
  if (v instanceof Element) {
    v = v.textContent;
  }
  return v.trim();
}

function parseDeadline(year, s) {
  const [month, date] = s.split('/');
  return new Date(year, month - 1, date, 23, 59, 59, 999);
}

function getRemainDays(deadline) {
  const now = new Date();
  return Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getResult() {
  const year = getNumber(document.querySelector('#studentTermId [selected]'));

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
          report.deadline = parseDeadline(year, getText(column));
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

  const now = new Date();
  let nextDeadline = null;
  subjects.forEach(subject => subject.reports.forEach(report => {
    if (report.deadline < now) {
      return;
    }
    if (nextDeadline == null || report.deadline < nextDeadline) {
      nextDeadline = report.deadline;
    }
  }));

  subjects.forEach(subject => subject.reports.forEach(report => {
    if (nextDeadline != null && report.deadline.getTime() == nextDeadline.getTime()) {
      report.state = 'current';
      return;
    }
    if (report.progress === 100) {
      report.state = 'completed';
      return;
    }
    if (report.deadline < now) {
      report.state = 'overdue';
      return;
    }
    report.state = 'future';
  }));

  return subjects;
}

function updateColors(result) {
  for (const subject of result) {
    for (const report of subject.reports) {
      let state = report.state;
      if (report.progress === 100) {
        state = 'completed';
      }
      report.deadlineElement.classList.add(`n-report-assist-${state}`);
      report.progressElement.classList.add(`n-report-assist-${state}`);
    }
  }
}

function showAdditionalInfo(result) {
  let currentReports = 0;
  let currentFinishedReports = 0;
  let currentProgress = 0;
  let nextDeadline = null;
  let overdueReports = 0;

  result.forEach(subject => subject.reports.forEach(report => {
    if (report.state === 'current') {
      currentReports++;
      if (report.progress === 100) {
        currentFinishedReports++;
      }
      currentProgress += report.progress;
      nextDeadline = report.deadline;
    }
    if (report.state === 'overdue') {
      overdueReports++;
    }
  }));

  const lines = [];

  if (nextDeadline != null ) {
    lines.push(`次の提出期日まで: ${getRemainDays(nextDeadline)} 日間`);
    lines.push(`今月のレポート: ${currentReports} 個 (${currentFinishedReports} 個完了)`);
    lines.push(`今月の進捗率: ${(currentProgress/currentReports).toFixed(2)} %`);
  }
  lines.push(`期日を過ぎたレポート: ${overdueReports} 個`);

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
    '現代文Ｂ(東京書籍版)': { id: 560, chapters: [6988, 6989, 6990, 6991, 6992, 6993, 6994, 6995, 6996, 6997, 6998, 6999] },
    '古典Ａ(東京書籍版)': { id: 561, chapters: [7000, 7001, 7002, 7003, 7004, 7005] },
    '世界史Ｂ(東京書籍版)': { id: 562, chapters: [7006, 7007, 7008, 7009, 7010, 7011, 7012, 7013, 7014, 7015, 7016, 7017] },
    '政治・経済(東京書籍版)': { id: 567, chapters: [7054, 7055, 7056, 7057, 7058, 7059] },
    '地学基礎(東京書籍版)': { id: 581, chapters: [7159, 7160, 7161, 7162, 7163, 7164] },
    '体育Ⅲ(東京書籍版)': { id: 584, chapters: [7170, 7171] },
    '英語表現Ⅰ(東京書籍版)': { id: 589, chapters: [7190, 7191, 7192, 7193, 7194, 7195] },
    '家庭総合(東京書籍版)': { id: 592, chapters: [7206, 7207, 7208, 7209, 7210, 7211, 7212, 7213] },
    '情報の科学(東京書籍版)': { id: 594, chapters: [7218, 7219, 7220, 7221] },
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
