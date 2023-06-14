const newRowForm = document.getElementById("newRowForm");

//Note we will use "ProjectWork_backend" in this JavaScript code a few times to call the backend
import { ProjectWork_backend } from "../../declarations/ProjectWork_backend";

const backendCI = "ajuq4-ruaaa-aaaaa-qaaga-cai";

//1. LOCAL DATA

//2. EVENT LISTENERS

document.addEventListener(
  "DOMContentLoaded",
  async (e) => {
    e.preventDefault();

    return false;
  },
  false
);

//Event listener that listens for when the form is submitted.
//When the form is submitted with an option, it calls the backend canister
//via "await ProjectWork_backend.vote(selectedOption)"
newRowForm.addEventListener(
  "submit",
  async (e) => {
    e.preventDefault();

    const file = document.getElementById("file").value.toString();
    const formData = getFormJson();
    const blob = new Blob([file], { type: "application/pdf" });
    const arrayBuffer = [...new Uint8Array(await blob.arrayBuffer())];

    formData.file = arrayBuffer;

    // Interact with foo actor, calling the greet method
    const res = await fetch(`/add_row?canisterId=${backendCI}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const newRow = await res.json();

    return false;
  },
  false
);

//3. HELPER FUNCTIONS
function getFormJson() {
  return {
    file: document.getElementById("file").value,
  };
}
