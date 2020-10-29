let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("pending", 1);

request.onupgradeneeded = function (event) {
  // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const pendingListStore = transaction.objectStore("pending");
  // add record to your store with add method.
  pendingListStore.add({ 
    name: record.name,
    value: record.value
  })
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const pendingListStore = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = pendingListStore.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite");
          // access your pending object store
          const pendingListStore = transaction.objectStore("pending");
          // clear all items in your store
          pendingListStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
