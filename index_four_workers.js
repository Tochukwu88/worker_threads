const express = require("express");
const { Worker } = require("worker_threads");
const app = express();
const port = process.env.PORT || 3000;
const THREAD_COUNT = process.env.NO_OF_THREADS || 4;

app.get("/non-blocking/", (req, res) => {
  res.status(200).send("This page is non-blocking");
});
function calculateCount() {
  return new Promise((resolve, reject) => {
    let counter = 0;
    for (let i = 0; i < 20_000_000_000; i++) {
      counter++;
    }
    resolve(counter);
  });
}
function createWorker() {
  return new Promise(function (resolve, reject) {
    const worker = new Worker("./four_workers.js", {
      workerData: { thread_count: THREAD_COUNT },
    });
    worker.on("message", (data) => {
      resolve(data);
    });
    worker.on("error", (msg) => {
      reject(`An error ocurred: ${msg}`);
    });
  });
}

app.get("/blocking", async (req, res) => {
  const workerPromises = [];
  for (let i = 0; i < THREAD_COUNT; i++) {
    workerPromises.push(createWorker());
  }
  console.log("worker promises: " + workerPromises.length);
  const thread_results = await Promise.all(workerPromises);
  let total = 0;
  for (let i = 0; i < thread_results.length; i++) {
    total = total + thread_results[i];
  }

  res.status(200).send(`result is ${total}`);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
