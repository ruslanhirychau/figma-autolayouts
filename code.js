"use strict";
const log = [];
const selection = figma.currentPage.selection;
const menu = {
    add: "add",
    remove: "remove"
};
function isFrame(object) {
    if (object.type === "FRAME" || object.type === "COMPONENT")
        return true;
    return false;
}
function hasAutoLayout(object) {
    if (isFrame(object) && object.layoutMode !== "NONE")
        return true;
    return false;
}
function isCompliant(command, object) {
    if (object.type !== "INSTANCE") {
        if (command === menu.remove)
            return !hasAutoLayout(object);
        if (command === menu.add)
            return hasAutoLayout(object);
    }
    return false;
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
        if (!hasAutoLayout(object))
            object.layoutMode = "VERTICAL";
        return object;
    }
    // Add frame and auto layout
    return addAutoLayout(frameIt(object));
}
function checkSum() {
    const compliantCount = log.filter((object) => object.compliant).length;
    return {
        validated: compliantCount === selection.length ? true : false,
        compliant: compliantCount,
    };
}
function updateSelection(command) {
    const toSelect = log.map((object) => {
        const node = figma.getNodeById(object.id);
        const type = object.type;
        switch (command) {
            case menu.add:
                if (type !== "FRAME" &&
                    type !== "COMPONENT" &&
                    type !== "INSTANCE" &&
                    type !== "GROUP")
                    return figma.getNodeById(node.parent.id);
            case menu.remove:
            default:
                return node;
        }
    });
    figma.currentPage.selection = toSelect;
}
function main() {
    // When nothing is selected on page
    if (selection.length === 0) {
        if (figma.command === menu.remove)
            figma.notify(`Please select frames or components if you wish to remove auto layout`);
        if (figma.command === menu.add)
            figma.notify(`Please select at least one object if you wish to apply auto layout`);
        figma.closePlugin();
        return;
    }
    for (const node of selection) {
        // Loop through each selected node on the current page
        const object = (() => {
            if (figma.command === menu.remove)
                return removeAutoLayout(node);
            if (figma.command === menu.add)
                return addAutoLayout(node);
        })();
        // Write result to check sum later
        log.push({
            id: object.id,
            type: object.type,
            compliant: isCompliant(figma.command, object)
        });
    }
    updateSelection(figma.command);
    // Notification
    figma.notify((() => {
        const sum = checkSum();
        if (sum.validated) {
            if (figma.command === menu.remove)
                return `✓ Auto layout has been removed`;
            if (figma.command === menu.add)
                return `✓ Auto layout has been applied`;
        }
        if (figma.command === menu.remove)
            return `Auto layout was removed from ${sum.compliant} of the selected objects`;
        if (figma.command === menu.add)
            return `Auto layout was applied to ${sum.compliant} of the selected objects`;
        return `Something went wrong. Please contact plugin author`;
    })());
    figma.closePlugin();
}
main();
