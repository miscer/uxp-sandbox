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

async function getPositionValue(project, trackItem) {
  const startTime = await trackItem.getStartTime();
  const param = await getParam(trackItem, "AE.ADBE Motion", "Position");
  return await param.getValueAtTime(startTime);
}

async function setPositionValue(project, trackItem, value) {
  const param = await getParam(trackItem, "AE.ADBE Motion", "Position");
  const keyframe = param.createKeyframe(value);

  await project.lockedAccess(async () => {
    await project.executeTransaction((compoundAction) => {
      const action = param.createSetValueAction(keyframe);
      compoundAction.addAction(action);
    });
  });
}

async function updateValueOnFirst() {
  const project = await ppro.Project.getActiveProject();
  const firstItem = await getFirstVideoTrackItem(project);

  const currentValue = await getPositionValue(project, firstItem);
  console.log("Current value:", currentValue.value);

  await setPositionValue(project, firstItem, [0, 0]);
}

document.querySelector("#value-button").addEventListener("click", () => {
  updateValueOnFirst().catch((error) => console.error(error));
});
