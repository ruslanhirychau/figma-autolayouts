const selectionCount = figma.currentPage.selection.length;
const nodes = [];

function isFrame(object) {
  if (object.type === "FRAME" || object.type === "COMPONENT") return true;

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
  const objectIndex = object.parent.children.indexOf(object);
  object.parent.insertChild(objectIndex, frame);

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

function checkSum() {
  const compliantCount = nodes.filter((object) => object.compliant).length;

  return {
    validated: compliantCount === selectionCount ? true : false,
    compliant: compliantCount,
  };
}

function updateSelection(command) {
  const toSelect = nodes.map((object) => {
    const node = figma.getNodeById(object.id);
    const type = object.type;

    switch (command) {
      case "add":
        if (
          type !== "FRAME" &&
          type !== "COMPONENT" &&
          type !== "INSTANCE" &&
          type !== "GROUP"
        )
          return figma.getNodeById(node.parent.id);
      case "remove":
      default:
        return node;
    }
  });

  figma.currentPage.selection = toSelect;
}

function main() {
  if (selectionCount === 0) {
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

  updateSelection(figma.command);

  // Notification
  figma.notify(
    (() => {
      const compliant = checkSum().compliant;

      if (checkSum().validated) {
        if (figma.command === "remove") return `✓ Auto layout has been removed`;
        if (figma.command === "add") return `✓ Auto layout has been applied`;
      }

      if (figma.command === "remove")
        return `Auto layout was removed from ${compliant} of the selected objects`;
      if (figma.command === "add")
        return `Auto layout was applied to only ${compliant} of the selected objects`;
    })()
  );
}

main();

figma.closePlugin();
