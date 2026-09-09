let reqEditor, resEditor;

window.addEventListener('DOMContentLoaded', () => {
  reqEditor = CodeMirror.fromTextArea(document.getElementById('requestBody'), {
    mode: 'application/json',
    theme: 'dracula',
    lineNumbers: true
  });

  resEditor = CodeMirror.fromTextArea(document.getElementById('responseBody'), {
    mode: 'application/json',
    theme: 'dracula',
    lineNumbers: true,
    readOnly: true
  });
});

function loadPreset(method, url, body = '') {
  document.getElementById('httpMethod').value = method;
  document.getElementById('apiUrl').value = url;
  reqEditor.setValue(body);
}

async function sendRequest() {
  const url = document.getElementById('apiUrl').value.trim();
  const method = document.getElementById('httpMethod').value;
  const statusBadge = document.getElementById('statusBadge');
  
  statusBadge.style.display = 'inline-block';
  statusBadge.className = 'status-badge';
  statusBadge.innerText = 'Sending...';

  const headers = {};
  const keys = document.querySelectorAll('.header-key');
  const vals = document.querySelectorAll('.header-val');
  keys.forEach((k, idx) => {
    if (k.value.trim()) headers[k.value.trim()] = vals[idx].value.trim();
  });

  const options = { method, headers };
  if (['POST', 'PUT'].includes(method)) {
    options.body = reqEditor.getValue();
  }

  const startTime = performance.now();
  try {
    const response = await fetch(url, options);
    const time = (performance.now() - startTime).toFixed(0);
    const data = await response.json();

    statusBadge.innerText = `${response.status} ${response.statusText} (${time}ms)`;
    statusBadge.classList.add(response.ok ? 'success' : 'error');
    resEditor.setValue(JSON.stringify(data, null, 2));
  } catch (err) {
    statusBadge.innerText = 'Error';
    statusBadge.classList.add('error');
    resEditor.setValue(JSON.stringify({ error: err.message }, null, 2));
  }
}