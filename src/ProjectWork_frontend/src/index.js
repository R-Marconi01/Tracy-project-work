const ic = require("ic0");
const fetch = require("isomorphic-fetch");

const { replica, HttpAgent } = ic;
var agent, backend;

const newRowForm = document.getElementById("newRowForm");

//Note we will use "ProjectWork_backend" in this JavaScript code a few times to call the backend
import { ProjectWork_backend } from "../../declarations/ProjectWork_backend";

const backendCI = "c5kvi-uuaaa-aaaaa-qaaia-cai";

//1. LOCAL DATA

//2. EVENT LISTENERS

document.addEventListener(
  "DOMContentLoaded",
  async (e) => {
    e.preventDefault();

    agent = new HttpAgent({ host: "http://127.0.0.1:4943", fetch });
    await agent.fetchRootKey();
    backend = replica(agent)("c5kvi-uuaaa-aaaaa-qaaia-cai");

    return false;
  },
  false
);

newRowForm.addEventListener(
  "submit",
  async (e) => {
    e.preventDefault();

    var file = document.getElementById("file").files[0];
    var reader = new FileReader();
    reader.onload = async function () {
      const name = file.name;
      var blob = window.dataURLtoBlob(reader.result);
      const data = [...new Uint8Array(await blob.arrayBuffer())];

      await backend.call("store", `${name}`, data);

      displayPdf(file.name);
    };
    reader.readAsDataURL(file);

    return false;
  },
  false
);

//3. HELPER FUNCTIONS
async function displayPdf(fileName) {
  let fileObj = { filename: fileName };
  const res = await fetch(`/file.pdf?canisterId=${backendCI}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fileObj),
  });

  const blob = await res.blob();

  var reader = new FileReader();
  reader.onload = async function () {
    document.getElementById("object").data = reader.result;
    document.getElementById("iframe").src = reader.result;
  };
  reader.readAsDataURL(blob);
}
