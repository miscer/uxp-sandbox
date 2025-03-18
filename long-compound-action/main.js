const ppro = require("premierepro");

async function getFirstVideoTrackItem(project) {
  const sequence = await project.getActiveSequence();
  const videoTrack = await sequence.getVideoTrack(0);
  const trackItems = await videoTrack.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
  return trackItems[0];
}

async function getParam(trackItem, componentName, paramName) {
  const components = await trackItem.getComponentChain();

  for (let i = 0; i < components.getComponentCount(); i++) {
    const component = components.getComponentAtIndex(i);
    const matchName = await component.getMatchName();

    if (matchName === componentName) {
      for (let j = 0; j < component.getParamCount(); j++) {
        const param = component.getParam(j);

        if (param.displayName === paramName) {
          return param;
        }
      }
    }
  }

  return null;
}

const MAX_IDLE_TIME = 1000;

let activeTransaction = {project: null, compoundAction: null, lastActionAt: null};

function isTransactionActive(project) {
  // Active transaction must match project and last action must be recent enough
  if (activeTransaction.project !== project) return false;
  return Date.now() - activeTransaction.lastActionAt <= MAX_IDLE_TIME;
}

async function getCompoundAction(project) {
  if (!isTransactionActive(project)) {
    // Start new transaction and save the compound action for later use

    console.log("Start new transaction");

    await project.executeTransaction((compoundAction) => {
      activeTransaction = {project, compoundAction, lastActionAt: null};
    });
  }

  activeTransaction.lastActionAt = Date.now();

  return activeTransaction.compoundAction;
}

async function setScaleValue(project, trackItem, value, immediate) {
  const param = await getParam(trackItem, "AE.ADBE Motion", "Scale");
  const keyframe = param.createKeyframe(value);

  await project.lockedAccess(async () => {
    const setValueAction = param.createSetValueAction(keyframe);

    if (immediate) {
      // set the value immediately, inside a new transaction
      console.log(`Execute transaction to set value to ${value}`);

      await project.executeTransaction((compoundAction) => {
        compoundAction.addAction(setValueAction);
      });
    } else {
      // use a transaction that has been created before, and add a new action to it to set the value
      const compoundAction = await getCompoundAction(project);

      console.log(`Add action to set value to ${value}`);
      compoundAction.addAction(setValueAction);
    }
  });
}

async function updateValue(value, immediate = false) {
  const project = await ppro.Project.getActiveProject();
  const firstItem = await getFirstVideoTrackItem(project);
  await setScaleValue(project, firstItem, value, immediate);
}

document.querySelector("#grouped-slider").addEventListener("input", (event) => {
  updateValue(event.target.value, false).catch((error) => console.error(error));
});

document.querySelector("#immediate-slider").addEventListener("input", (event) => {
  updateValue(event.target.value, true).catch((error) => console.error(error));
});
