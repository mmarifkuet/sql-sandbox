const regexInput = document.getElementById('regexInput');
const testText = document.getElementById('testText');
const flagG = document.getElementById('flagG');
const flagI = document.getElementById('flagI');
const flagM = document.getElementById('flagM');

const highlightedOutput = document.getElementById('highlightedOutput');
const matchesList = document.getElementById('matchesList');
const matchCount = document.getElementById('matchCount');
const errorMsg = document.getElementById('errorMsg');

function getFlags() {
  let flags = '';
  if (flagG.checked) flags += 'g';
  if (flagI.checked) flags += 'i';
  if (flagM.checked) flags += 'm';
  return flags;
}

function processRegex() {
  const pattern = regexInput.value;
  const text = testText.value;
  const flags = getFlags();

  errorMsg.style.display = 'none';

  if (!pattern) {
    highlightedOutput.innerText = text;
    matchesList.innerHTML = '';
    matchCount.innerText = '0 matches';
    return;
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;

    if (flags.includes('g')) {
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
          length: match[0].length
        });
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
    } else {
      match = regex.exec(text);
      if (match) {
        matches.push({
          value: match[0],
          index: match.index,
          length: match[0].length
        });
      }
    }

    renderHighlights(text, matches);
    renderMatchesList(matches);
  } catch (err) {
    errorMsg.style.display = 'block';
    errorMsg.innerText = 'Invalid Regex: ' + err.message;
  }
}

function renderHighlights(text, matches) {
  if (matches.length === 0) {
    highlightedOutput.innerText = text;
    return;
  }

  let html = '';
  let lastIdx = 0;

  matches.forEach(m => {
    html += escapeHtml(text.slice(lastIdx, m.index));
    html += `<span class="highlight-match">${escapeHtml(m.value)}</span>`;
    lastIdx = m.index + m.length;
  });

  html += escapeHtml(text.slice(lastIdx));
  highlightedOutput.innerHTML = html;
}

function renderMatchesList(matches) {
  matchCount.innerText = `${matches.length} match${matches.length === 1 ? '' : 'es'}`;
  matchesList.innerHTML = '';

  if (matches.length === 0) {
    matchesList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No matches found.</span>';
    return;
  }

  matches.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'match-item';
    div.innerHTML = `
      <span>Match ${i + 1}: <strong style="color: var(--accent-blue);">${escapeHtml(m.value)}</strong></span>
      <span class="match-index">Index: ${m.index} - ${m.index + m.length}</span>
    `;
    matchesList.appendChild(div);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadPattern(pattern, sampleText) {
  regexInput.value = pattern;
  testText.value = sampleText;
  processRegex();
}

// Event Listeners
regexInput.addEventListener('input', processRegex);
testText.addEventListener('input', processRegex);
flagG.addEventListener('change', processRegex);
flagI.addEventListener('change', processRegex);
flagM.addEventListener('change', processRegex);

// Initial Execution
window.addEventListener('DOMContentLoaded', processRegex);