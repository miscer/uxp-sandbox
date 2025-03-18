const ppro = require("premierepro");

async function runExampleAction() {
  const project = await ppro.Project.getActiveProject();
  console.log("Active project:", project.name);
}

document.querySelector("#sample-button").addEventListener("click", runExampleAction);
