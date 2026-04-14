function init(basePath) {
    var action = new RGuiAction(qsTranslate("BatchCncCleanup", "Batch CNC Cleanup..."), RMainWindowQt.getMainWindow());
    action.setRequiresDocument(false);
    action.setScriptFile(basePath + "/BatchCncCleanup.js");
    action.setStatusTip(qsTranslate("BatchCncCleanup", "Batch cleanup DXF / DWG files for CNC/CAM"));
    action.setDefaultCommands(["batchcnccleanup", "bcc"]);
    action.setGroupSortOrder(52100);
    action.setSortOrder(550);
    action.setWidgetNames(["MiscIOMenu", "MiscIOToolBar", "MiscIOToolsPanel"]);
}
