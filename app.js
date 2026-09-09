let db = null;
let SQL = null;
let editor = null;
let currentChallenge = null;

mermaid.initialize({ startOnLoad: false, theme: 'dark' });

const challenges = [
  { id: 1, title: "1. Admins Only", description: "Select name and role from users where role is Admin", target: "SELECT name, role FROM users WHERE role='Admin';" },
  { id: 2, title: "2. High Price Items", description: "Select title and price from products where price > 50", target: "SELECT title, price FROM products WHERE price > 50;" }
];

async function initDatabase() {
  const config = { locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` };
  try {
    SQL = await initSqlJs(config);
    
    // Initialize CodeMirror Editor
    editor = CodeMirror.fromTextArea(document.getElementById('queryInput'), {
      mode: 'text/x-sql',
      theme: 'dracula',
      lineNumbers: true,
      viewportMargin: Infinity
    });

    loadPresetDatabase();
    renderChallenges();
  } catch (err) {
    document.getElementById('statusBar').innerText = "Initialization failed: " + err.message;
  }
}

function loadPresetDatabase() {
  const preset = document.getElementById('presetDbSelect').value;
  db = new SQL.Database();

  if (preset === 'default') {
    db.run(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
      INSERT INTO users VALUES (1, 'Alice', 'Admin'), (2, 'Bob', 'Developer'), (3, 'Charlie', 'Designer');

      CREATE TABLE products (id INTEGER PRIMARY KEY, title TEXT, price REAL);
      INSERT INTO products VALUES (101, 'Laptop', 1200.00), (102, 'Mouse', 25.50), (103, 'Keyboard', 85.00);
    `);
    editor.setValue("SELECT * FROM users;");
  } else if (preset === 'ecommerce') {
    db.run(`
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
      INSERT INTO customers VALUES (1, 'John Doe', 'john@example.com'), (2, 'Jane Smith', 'jane@example.com');

      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INT, amount REAL);
      INSERT INTO orders VALUES (5001, 1, 299.99), (5002, 1, 49.50), (5003, 2, 150.00);
    `);
    editor.setValue("SELECT customers.name, orders.amount FROM customers JOIN orders ON customers.id = orders.customer_id;");
  } else if (preset === 'company') {
    db.run(`
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INT);
      INSERT INTO employees VALUES (10, 'Sarah', 'Engineering', 95000), (11, 'Alex', 'Marketing', 62000), (12, 'Michael', 'Engineering', 88000);
    `);
    editor.setValue("SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department;");
  }

  renderSchema();
  runQuery();
}

function renderSchema() {
  const schemaList = document.getElementById('schemaList');
  schemaList.innerHTML = '';
  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  if (res.length > 0) {
    res[0].values.forEach(row => {
      const div = document.createElement('div');
      div.className = 'table-badge';
      div.innerHTML = `<span>📁 ${row[0]}</span>`;
      schemaList.appendChild(div);
    });
  }
  renderERDiagram();
}

function renderChallenges() {
  const container = document.getElementById('challengeList');
  container.innerHTML = '';
  challenges.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'challenge-card';
    card.onclick = () => {
      currentChallenge = ch;
      editor.setValue('');
      document.getElementById('statusBar').innerText = `Task: ${ch.description}`;
    };
    card.innerHTML = `<div class="challenge-title">${ch.title}</div><div class="challenge-desc">${ch.description}</div>`;
    container.appendChild(card);
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  if (tab === 'editor') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('tab-editor').classList.add('active');
    setTimeout(() => editor.refresh(), 10);
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('tab-er').classList.add('active');
  }
}

function runQuery() {
  return executeSQL(editor.getValue());
}

function explainQuery() {
  executeSQL(`EXPLAIN QUERY PLAN ${editor.getValue()}`);
}

function formatSQL() {
  const formatted = sqlFormatter.format(editor.getValue(), { language: 'sql' });
  editor.setValue(formatted);
}

function executeSQL(sql) {
  if (!db) return;
  const tableOutput = document.getElementById('tableOutput');
  const statusBar = document.getElementById('statusBar');
  tableOutput.innerHTML = '';

  const startTime = performance.now();
  try {
    const results = db.exec(sql);
    const time = (performance.now() - startTime).toFixed(2);

    if (results.length === 0) {
      statusBar.innerText = `Executed in ${time}ms. (No rows returned)`;
      return null;
    }

    const { columns, values } = results[0];
    statusBar.innerText = `Executed in ${time}ms. Returned ${values.length} row(s).`;

    const table = document.createElement('table');
    const trHead = document.createElement('tr');
    columns.forEach(c => { const th = document.createElement('th'); th.innerText = c; trHead.appendChild(th); });
    table.appendChild(trHead);

    values.forEach(row => {
      const trRow = document.createElement('tr');
      row.forEach(cell => { const td = document.createElement('td'); td.innerText = cell; trRow.appendChild(td); });
      table.appendChild(trRow);
    });

    tableOutput.appendChild(table);
    return results[0];
  } catch (err) {
    statusBar.innerText = "Error executing query.";
    tableOutput.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
    return null;
  }
}

function checkAnswer() {
  if (!currentChallenge) return alert('Select a challenge from the sidebar first!');
  const userRes = runQuery();
  const targetRes = db.exec(currentChallenge.target)[0];
  const vBox = document.getElementById('validationBox');
  vBox.style.display = 'block';

  if (userRes && JSON.stringify(userRes) === JSON.stringify(targetRes)) {
    vBox.style.background = 'rgba(74, 222, 128, 0.2)';
    vBox.style.color = '#4ade80';
    vBox.innerText = "🎉 Correct answer!";
  } else {
    vBox.style.background = 'rgba(248, 113, 113, 0.2)';
    vBox.style.color = '#f87171';
    vBox.innerText = "❌ Incorrect result. Keep trying!";
  }
}

/* Import / Export Database */
function exportDatabase() {
  const binaryArray = db.export();
  const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'sandbox_database.sqlite';
  link.click();
}

function importDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function() {
    const Uints = new Uint8Array(reader.result);
    db = new SQL.Database(Uints);
    renderSchema();
    editor.setValue("SELECT name FROM sqlite_master WHERE type='table';");
    runQuery();
  };
  reader.readAsArrayBuffer(file);
}

/* ER Diagram Generator */
async function renderERDiagram() {
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  if (tables.length === 0) return;

  let diagramText = "erDiagram\n";
  tables[0].values.forEach(row => {
    const tName = row[0];
    const cols = db.exec(`PRAGMA table_info(${tName});`);
    diagramText += `  ${tName} {\n`;
    if (cols.length > 0) {
      cols[0].values.forEach(c => {
        diagramText += `    ${c[2]} ${c[1]}\n`;
      });
    }
    diagramText += `  }\n`;
  });

  const element = document.getElementById('mermaidDiagram');
  element.removeAttribute('data-processed');
  element.innerHTML = diagramText;
  await mermaid.run({ nodes: [element] });
}

/* Modal Helpers */
function openCreateTableModal() { document.getElementById('tableModal').style.display = 'flex'; }
function closeCreateTableModal() { document.getElementById('tableModal').style.display = 'none'; }

function addColumnRow() {
  const container = document.getElementById('columnsContainer');
  const div = document.createElement('div');
  div.className = 'column-row';
  div.innerHTML = `
    <input type="text" placeholder="Column Name" class="col-name">
    <select class="col-type">
      <option value="TEXT">TEXT</option>
      <option value="INTEGER">INTEGER</option>
      <option value="REAL">REAL</option>
    </select>
  `;
  container.appendChild(div);
}

function submitCreateTable() {
  const tableName = document.getElementById('modalTableName').value.trim();
  if (!tableName) return alert('Enter a table name');

  const names = document.querySelectorAll('.col-name');
  const types = document.querySelectorAll('.col-type');
  const cols = [];

  names.forEach((input, index) => {
    if (input.value.trim()) {
      cols.push(`${input.value.trim()} ${types[index].value}`);
    }
  });

  if (cols.length === 0) return alert('Add at least one column');

  const sql = `CREATE TABLE ${tableName} (${cols.join(', ')});`;
  db.run(sql);
  renderSchema();
  closeCreateTableModal();
  document.getElementById('statusBar').innerText = `Table '${tableName}' created successfully.`;
}

document.getElementById('runBtn').addEventListener('click', runQuery);
document.getElementById('formatBtn').addEventListener('click', formatSQL);
document.getElementById('explainBtn').addEventListener('click', explainQuery);
document.getElementById('checkBtn').addEventListener('click', checkAnswer);
window.addEventListener('DOMContentLoaded', initDatabase);