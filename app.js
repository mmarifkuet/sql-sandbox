let db = null;
let lastQueryResult = null;

async function initDatabase() {
  const config = {
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  };

  try {
    const SQL = await initSqlJs(config);
    db = new SQL.Database();
    
    seedData();
    renderSchema();
    renderHistory();
    document.getElementById('queryInput').value = "SELECT * FROM users;";
    document.getElementById('statusBar').innerText = "Database initialized successfully.";
    runQuery();
  } catch (err) {
    document.getElementById('statusBar').innerText = "Failed to load database: " + err.message;
  }
}

function seedData() {
  const setupSQL = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
    INSERT INTO users VALUES (1, 'Alice', 'Admin');
    INSERT INTO users VALUES (2, 'Bob', 'Developer');
    INSERT INTO users VALUES (3, 'Charlie', 'Designer');

    CREATE TABLE products (id INTEGER PRIMARY KEY, title TEXT, price REAL);
    INSERT INTO products VALUES (101, 'Laptop', 1200.00);
    INSERT INTO products VALUES (102, 'Wireless Mouse', 25.50);
    INSERT INTO products VALUES (103, 'Mechanical Keyboard', 85.00);
  `;
  db.run(setupSQL);
}

function renderSchema() {
  const schemaList = document.getElementById('schemaList');
  schemaList.innerHTML = '';

  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  if (res.length > 0) {
    res[0].values.forEach(row => {
      const tableName = row[0];
      const div = document.createElement('div');
      div.className = 'table-badge';
      div.innerText = `📁 ${tableName}`;
      schemaList.appendChild(div);
    });
  }
}

function setQuery(query) {
  document.getElementById('queryInput').value = query;
  runQuery();
}

function saveToHistory(query) {
  let history = JSON.parse(localStorage.getItem('sql_history') || '[]');
  if (!history.includes(query)) {
    history.unshift(query);
    if (history.length > 5) history.pop();
    localStorage.setItem('sql_history', JSON.stringify(history));
    renderHistory();
  }
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  const history = JSON.parse(localStorage.getItem('sql_history') || '[]');
  
  if (history.length === 0) {
    historyList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">No history yet.</span>';
    return;
  }

  historyList.innerHTML = '';
  history.forEach(q => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerText = q;
    div.title = q;
    div.onclick = () => setQuery(q);
    historyList.appendChild(div);
  });
}

function runQuery() {
  if (!db) return;

  const query = document.getElementById('queryInput').value;
  const tableOutput = document.getElementById('tableOutput');
  const statusBar = document.getElementById('statusBar');
  tableOutput.innerHTML = '';
  lastQueryResult = null;

  const startTime = performance.now();

  try {
    const results = db.exec(query);
    const executionTime = (performance.now() - startTime).toFixed(2);

    saveToHistory(query);

    if (results.length === 0) {
      statusBar.innerText = `Query executed in ${executionTime}ms. (0 rows returned)`;
      return;
    }

    lastQueryResult = results[0];
    const { columns, values } = results[0];
    statusBar.innerText = `Query executed in ${executionTime}ms. Returned ${values.length} row(s).`;

    const table = document.createElement('table');

    // Header
    const trHead = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col;
      trHead.appendChild(th);
    });
    table.appendChild(trHead);

    // Rows
    values.forEach(row => {
      const trRow = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.innerText = cell;
        trRow.appendChild(td);
      });
      table.appendChild(trRow);
    });

    tableOutput.appendChild(table);
  } catch (error) {
    statusBar.innerText = "Error executing query.";
    tableOutput.innerHTML = `<span style="color: #ef4444; font-family: monospace;">SQL Error: ${error.message}</span>`;
  }
}

function exportToCSV() {
  if (!lastQueryResult) {
    alert("No query results available to export!");
    return;
  }

  const { columns, values } = lastQueryResult;
  let csvContent = "data:text/csv;charset=utf-8,";

  csvContent += columns.join(",") + "\n";
  values.forEach(row => {
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "sql_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.getElementById('runBtn').addEventListener('click', runQuery);
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
window.addEventListener('DOMContentLoaded', initDatabase);