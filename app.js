let db = null;
let currentChallenge = null;

const challenges = [
  {
    id: 1,
    title: "1. Filter Admins",
    description: "Select the 'name' and 'role' of all users whose role is 'Admin'.",
    targetQuery: "SELECT name, role FROM users WHERE role = 'Admin';"
  },
  {
    id: 2,
    title: "2. Premium Products",
    description: "Find all product titles and prices where price is greater than 50.",
    targetQuery: "SELECT title, price FROM products WHERE price > 50;"
  },
  {
    id: 3,
    title: "3. Total Users Count",
    description: "Write a query to count total records in the users table as 'total'.",
    targetQuery: "SELECT COUNT(*) as total FROM users;"
  }
];

async function initDatabase() {
  const config = {
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  };

  try {
    const SQL = await initSqlJs(config);
    db = new SQL.Database();
    
    seedData();
    renderSchema();
    renderChallenges();
    selectChallenge(1);
    
    document.getElementById('statusBar').innerText = "Database ready.";
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
      const div = document.createElement('div');
      div.className = 'table-badge';
      div.innerText = `📁 ${row[0]}`;
      schemaList.appendChild(div);
    });
  }
}

function renderChallenges() {
  const container = document.getElementById('challengeList');
  container.innerHTML = '';

  challenges.forEach(ch => {
    const card = document.createElement('div');
    card.className = `challenge-card ${currentChallenge?.id === ch.id ? 'active' : ''}`;
    card.onclick = () => selectChallenge(ch.id);
    card.innerHTML = `
      <div class="challenge-title">${ch.title}</div>
      <div class="challenge-desc">${ch.description}</div>
    `;
    container.appendChild(card);
  });
}

function selectChallenge(id) {
  currentChallenge = challenges.find(c => c.id === id);
  renderChallenges();
  document.getElementById('challengeBanner').innerHTML = `
    <strong>Task:</strong> ${currentChallenge.description}
  `;
  document.getElementById('queryInput').value = '';
  hideValidation();
}

function runQuery() {
  if (!db) return null;
  hideValidation();

  const query = document.getElementById('queryInput').value;
  const tableOutput = document.getElementById('tableOutput');
  const statusBar = document.getElementById('statusBar');
  tableOutput.innerHTML = '';

  const startTime = performance.now();

  try {
    const results = db.exec(query);
    const executionTime = (performance.now() - startTime).toFixed(2);

    if (results.length === 0) {
      statusBar.innerText = `Executed in ${executionTime}ms. (No rows returned)`;
      return null;
    }

    const { columns, values } = results[0];
    statusBar.innerText = `Executed in ${executionTime}ms. Returned ${values.length} row(s).`;

    const table = document.createElement('table');
    const trHead = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col;
      trHead.appendChild(th);
    });
    table.appendChild(trHead);

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
    return results[0];
  } catch (error) {
    statusBar.innerText = "Error executing query.";
    tableOutput.innerHTML = `<span style="color: #ef4444; font-family: monospace;">SQL Error: ${error.message}</span>`;
    return null;
  }
}

function checkAnswer() {
  if (!currentChallenge) return;

  const userResult = runQuery();
  const expectedResult = db.exec(currentChallenge.targetQuery)[0];

  const valBox = document.getElementById('validationBox');
  valBox.style.display = 'block';

  if (!userResult) {
    valBox.className = 'validation-msg validation-error';
    valBox.innerText = '❌ Incorrect. Your query did not return any valid results.';
    return;
  }

  const isMatch = JSON.stringify(userResult) === JSON.stringify(expectedResult);

  if (isMatch) {
    valBox.className = 'validation-msg validation-success';
    valBox.innerText = '🎉 Correct! Your query matches the expected output.';
  } else {
    valBox.className = 'validation-msg validation-error';
    valBox.innerText = '❌ Incorrect result structure or values. Try adjusting your query!';
  }
}

function hideValidation() {
  const valBox = document.getElementById('validationBox');
  valBox.style.display = 'none';
}

document.getElementById('runBtn').addEventListener('click', runQuery);
document.getElementById('checkBtn').addEventListener('click', checkAnswer);
window.addEventListener('DOMContentLoaded', initDatabase);