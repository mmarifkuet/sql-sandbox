let db = null;

// Initialize sql.js asynchronously
async function initDatabase() {
  const config = {
    // Locate the .wasm file hosted on CDN
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  };

  try {
    const SQL = await initSqlJs(config);
    db = new SQL.Database(); // Create an in-memory database
    
    seedData();
    document.getElementById('output').innerText = "Database ready! Click 'Run Query'.";
  } catch (err) {
    document.getElementById('output').innerText = "Failed to load database: " + err.message;
  }
}

// Seed the database with sample schema and data
function seedData() {
  const setupSQL = `
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
    INSERT INTO users VALUES (1, 'Alice', 'Admin');
    INSERT INTO users VALUES (2, 'Bob', 'Developer');
    INSERT INTO users VALUES (3, 'Charlie', 'Designer');
  `;
  db.run(setupSQL);
}

// Execute query and build HTML table
function runQuery() {
  if (!db) return;

  const query = document.getElementById('queryInput').value;
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = '';

  try {
    const results = db.exec(query);

    if (results.length === 0) {
      outputDiv.innerText = "Query executed successfully. (No output rows returned)";
      return;
    }

    // Build table header and rows from results object
    const { columns, values } = results[0];
    const table = document.createElement('table');

    // Header row
    const trHead = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col;
      trHead.appendChild(th);
    });
    table.appendChild(trHead);

    // Data rows
    values.forEach(row => {
      const trRow = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.innerText = cell;
        trRow.appendChild(td);
      });
      table.appendChild(trRow);
    });

    outputDiv.appendChild(table);
  } catch (error) {
    outputDiv.innerText = "SQL Error: " + error.message;
  }
}

// Event Listeners
document.getElementById('runBtn').addEventListener('click', runQuery);
window.addEventListener('DOMContentLoaded', initDatabase);