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
      currentSubject = {
        name: getText(columns.shift()),
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

const result = getResult();
updateColors(result);
showAdditionalInfo(result);
