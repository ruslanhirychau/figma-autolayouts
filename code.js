const nodes = [];

function isFrame(object) {
  if (
    object.type === "FRAME" ||
    object.type === "COMPONENT" ||
    object.type === "INSTANCE"
  )
    return true;

  return false;
}

function hasAutoLayout(object) {
  if (isFrame(object) && object.layoutMode !== "NONE") return true;

  return false;
}

function isCompliant(command, object) {
  if (command === "remove") return !hasAutoLayout(object);
  if (command === "add") return hasAutoLayout(object);
}

function frameIt(object) {
  const frame = figma.createFrame();
  object.parent.appendChild(frame);

  frame.resizeWithoutConstraints(object.width, object.height);
  frame.name = object.name;
  frame.x = object.x;
  frame.y = object.y;
  frame.fills = [];

  // Moving content to frame
  object.type === "GROUP"
    ? object.children.forEach((child) => frame.appendChild(child))
    : frame.appendChild(object);

  return frame;
}

function removeAutoLayout(object) {
  if (hasAutoLayout(object)) {
    object.layoutMode = "NONE";
  }

  return object;
}

function addAutoLayout(object) {
  if (isFrame(object)) {
    // Add auto layout to frame
    if (!hasAutoLayout(object)) object.layoutMode = "VERTICAL";

    return object;
  }

  // Add frame and auto layout
  return addAutoLayout(frameIt(object));
}

function updateSelection() {
  const toSelect = nodes.map((index) => {
    const node = figma.getNodeById(index.id);
    const type = index.type;

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

// Debug ->
console.clear();
console.log("Command: " + figma.command);
console.log("Selection: " + figma.currentPage.selection.length);
// <- Debug

function main() {
  if (figma.currentPage.selection.length === 0) {
    if (figma.command === "remove")
      figma.notify(
        "Please select frames or components if you wish to remove auto layout"
      );
    if (figma.command === "add")
      figma.notify(
        "Please select at least one object if you wish to apply auto layout"
      );

    figma.closePlugin();
    return;
  }

  for (const node of figma.currentPage.selection) {
    // Loop through each selected node on the current page
    const object = (() => {
      if (figma.command === "remove") return removeAutoLayout(node);
      if (figma.command === "add") return addAutoLayout(node);
    })();

    nodes.push({
      id: object.id,
      type: object.type,
      compliant: isCompliant(figma.command, object),
    });
  }

  console.log(nodes); // <- Debug
  updateSelection();

  // Close the plugin
  function isAllCompliant() {
    const allCompliant = nodes
      .map((object) => object.compliant)
      .every((value) => value === true);
    return allCompliant;
  }

  if (figma.command === "remove")
    figma.notify(
      true
        ? "✓ Auto layout has been removed"
        : "Auto layout was removed from some of the selected objects"
    );
  if (figma.command === "add")
    figma.notify(
      true
        ? "✓ Auto layout has been applied"
        : "Auto layout was applied to only some of the selected objects"
    );
}

main();

figma.closePlugin();
