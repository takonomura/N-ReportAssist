function formatDuration(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor(seconds % 3600 / 60);
    seconds = seconds % 60;

    function formatNumber(n) {
        return String(n).padStart(2, '0');
    }
    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
}

function getInfo() {
  return JSON.parse(document.querySelector('[data-react-class="App.Chapter"][data-react-props]').dataset.reactProps);
}

function showTotalDuration() {
  const totalDuration = getInfo().chapter.chapter.sections
    .filter(section => section.resource_type === 'movie')
    .map(section => section.length)
    .reduce((len, total) => total + len);
  const headerElement = document.querySelector('.u-list-header > .typo-list-title > span');
  headerElement.textContent += ` (${formatDuration(totalDuration)})`;
}

showTotalDuration();
