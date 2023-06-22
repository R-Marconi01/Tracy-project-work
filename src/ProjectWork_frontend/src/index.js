const ic = require("ic0");
const fetch = require("isomorphic-fetch");

const { replica, HttpAgent } = ic;
var agent, backend;

const uploadBtn = document.getElementById("uploadBtn");
const jsonForm = document.getElementById("jsonForm");

//Note we will use "ProjectWork_backend" in this JavaScript code a few times to call the backend
import { ProjectWork_backend } from "../../declarations/ProjectWork_backend";

const backendCI = "c5kvi-uuaaa-aaaaa-qaaia-cai";

//1. LOCAL DATA
const documentList = [];

//2. EVENT LISTENERS

document.addEventListener(
  "DOMContentLoaded",
  async (e) => {
    e.preventDefault();

    agent = new HttpAgent({ host: "http://127.0.0.1:4943", fetch });
    await agent.fetchRootKey();
    backend = replica(agent)("c5kvi-uuaaa-aaaaa-qaaia-cai");

    //Load JSON from BE
    const res = await fetch(`/get-row-db?canisterId=${backendCI}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    if (json != null) {
      updateTableJson(json);
    }

    return false;
  },
  false
);

uploadBtn.addEventListener(
  "click",
  async (e) => {
    e.preventDefault();

    var file = document.getElementById("file").files[0];
    var reader = new FileReader();
    reader.onload = async function () {
      const name = file.name;
      var blob = window.dataURLtoBlob(reader.result);
      const data = [...new Uint8Array(await blob.arrayBuffer())];

      await backend.call("store", `${name}`, data);

      updateLocalDocumentList(file);
      updateTable();
    };
    reader.readAsDataURL(file);

    return false;
  },
  false
);

jsonForm.addEventListener(
  "submit",
  async (e) => {
    e.preventDefault();

    const formData = {
      id: document.getElementById("id").value,
      companyName: document.getElementById("companyName").value,
      cityDestination: document.getElementById("cityDestination").value,
      supplier: document.getElementById("supplier").value,
      cityOrigin: document.getElementById("cityOrigin").value,
      productType: document.getElementById("productType").value,
      quantity: document.getElementById("quantity").value,
    };

    const res = await fetch(`/add-row?canisterId=${backendCI}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    return false;
  },
  false
);

//3. HELPER FUNCTIONS
function updateLocalDocumentList(file) {
  let value = file.name;
  documentList.push(value);
}

function updateTable() {
  document.getElementById("table-body").innerHTML = "";
  for (let key in documentList) {
    let tr = document.createElement("tr");

    let th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.textContent = key;

    let td = document.createElement("td");
    td.textContent = documentList[key];

    let td2 = document.createElement("td");
    let button = document.createElement("button");
    button.classList.add("btn");
    button.classList.add("btn-outline-secondary");
    button.textContent = "View";
    button.onclick = function () {
      displayPdf(documentList[key]);
    };
    td2.appendChild(button);

    tr.appendChild(th);
    tr.appendChild(td);
    tr.appendChild(td2);

    document.getElementById("table-body").appendChild(tr);
  }
}

async function displayPdf(fileName) {
  let fileObj = { filename: fileName };
  const res = await fetch(`/file?canisterId=${backendCI}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fileObj),
  });

  const blob = await res.blob();

  var reader = new FileReader();
  reader.onload = async function () {
    document.getElementById("object").classList.remove("d-none");
    document.getElementById("iframe").classList.remove("d-none");
    document.getElementById("object").data = reader.result;
    document.getElementById("iframe").src = reader.result;
  };
  reader.readAsDataURL(blob);
}

function updateTableJson(jsonList) {
  document.getElementById("table-body-json").innerHTML = "";
  for (let key in jsonList) {
    let obj = jsonList[key];
    let tr = document.createElement("tr");

    let th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.textContent = obj.id;

    let td = document.createElement("td");
    td.textContent = obj.companyName;

    let td2 = document.createElement("td");
    td2.textContent = obj.cityDestination;

    let td3 = document.createElement("td");
    td3.textContent = obj.supplier;

    let td4 = document.createElement("td");
    td4.textContent = obj.cityOrigin;

    let td5 = document.createElement("td");
    td5.textContent = obj.productType;

    let td6 = document.createElement("td");
    td6.textContent = obj.quantity;

    tr.appendChild(th);
    tr.appendChild(td);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    tr.appendChild(td6);

    document.getElementById("table-body-json").appendChild(tr);
  }
}
