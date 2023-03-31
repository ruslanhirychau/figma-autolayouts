const nodesStatus = [];

function selectUpdatedNodes() {
  const toSelect = nodesStatus.map((index) => {
    const node = figma.getNodeById(index[1]);
    const type = index[2];

    if (
      type === "FRAME" ||
      type === "COMPONENT" ||
      type === "INSTANCE" ||
      type === "GROUP"
    )
      return node;
    else return figma.getNodeById(node.parent.id);
  });

  figma.currentPage.selection = toSelect;
}

function removeAutoLayoutToFrame(object) {
  if (
    object.type === "FRAME" ||
    object.type === "COMPONENT" ||
    object.type === "INSTANCE"
  ) {
    object.layoutMode = "NONE";
  }

  return true;
}

function addAutoLayoutToFrame(object) {
  if (object.type === "FRAME" || object.type === "COMPONENT") {
    // Frame

    if (object.layoutMode === "NONE") object.layoutMode = "VERTICAL";
    return true;
  } else if (object.type === "GROUP") {
    // Group

    // Get the parent and create new frame there
    const newFrame = figma.createFrame();
    object.parent.appendChild(newFrame);

    newFrame.resizeWithoutConstraints(object.width, object.height);
    newFrame.fills = [];
    newFrame.x = object.x;
    newFrame.y = object.y;
    newFrame.rotation = object.rotation;
    newFrame.name = object.name;

    // Copy the children of the GroupNode to the new FrameNode
    object.children.forEach((child) => {
      newFrame.appendChild(child);
    });

    // Add auto layout to new frame
    return addAutoLayoutToFrame(newFrame);
  } else {
    // Another object

    // Get the parent and create new frame there
    const newFrame = figma.createFrame();
    object.parent.appendChild(newFrame);

    // Moving object to new frame
    newFrame.resizeWithoutConstraints(object.width, object.height);
    newFrame.fills = [];
    newFrame.x = object.x;
    newFrame.y = object.y;
    newFrame.rotation = object.rotation;
    newFrame.name = object.name;

    newFrame.appendChild(object);

    // Add auto layout to new frame
    return addAutoLayoutToFrame(newFrame);
  }
}

// Debug ->
console.clear();
console.log("Command: " + figma.command);
console.log("Selection: " + figma.currentPage.selection.length);
// <- Debug

for (const selectedNode of figma.currentPage.selection) {
  // Loop through each selected node on the current page

  if (figma.command === "remove") {
    // Remove auto layout
    nodesStatus.push([
      selectedNode.parent.id,
      selectedNode.id,
      selectedNode.type,
      selectedNode.layoutMode,
      removeAutoLayoutToFrame(selectedNode),
    ]);

    continue;
  }

  // Add auto layout
  nodesStatus.push([
    selectedNode.parent.id,
    selectedNode.id,
    selectedNode.type,
    selectedNode.layoutMode,
    addAutoLayoutToFrame(selectedNode),
  ]);
}

console.log(nodesStatus); // <- Debug
//selectUpdatedNodes();

// Close the plugin
figma.command === "remove"
  ? figma.notify("Auto layout removed ✓")
  : figma.notify("Auto layout added ✓");

figma.closePlugin();
