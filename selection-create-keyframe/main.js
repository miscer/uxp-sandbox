const ppro = require("premierepro");

async function getSelectedTrackItem(project) {
  const sequence = await project.getActiveSequence();
  if (sequence == null) return null;

  const selection = await sequence.getSelection();
  const items = await selection.getTrackItems();
  if (items.length === 0) return null;

  return items[0];
}

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

async function setScaleValue(project, trackItem, value) {
  const param = await getParam(trackItem, "AE.ADBE Motion", "Scale");
  const keyframe = param.createKeyframe(value);

  await project.lockedAccess(async () => {
    await project.executeTransaction((compoundAction) => {
      const action = param.createSetValueAction(keyframe);
      compoundAction.addAction(action);
    });
  });
}

async function updateValueOnSelected() {
  const project = await ppro.Project.getActiveProject();
  const selectedItem = await getSelectedTrackItem(project);
  await setScaleValue(project, selectedItem, 50);
}

async function updateValueOnFirst() {
  const project = await ppro.Project.getActiveProject();
  const firstItem = await getFirstVideoTrackItem(project);
  await setScaleValue(project, firstItem, 200);
}

document.querySelector("#btn-first").addEventListener("click", () => {
  updateValueOnFirst().catch((error) => console.error(error));
});

document.querySelector("#btn-selected").addEventListener("click", () => {
  updateValueOnSelected().catch((error) => console.error(error));
});
