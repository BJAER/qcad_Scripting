include("scripts/EAction.js");
include("scripts/library.js");
include("scripts/File/File.js");
include("scripts/Modify/Explode/Explode.js");
include("scripts/simple_input.js");

function BatchCncCleanup(guiAction) {
    EAction.call(this, guiAction);
    this.tolerance = 0.1;
    this.clusterTolerance = 0.25;
    this.isolateWarn = false;
    this.preset = "Standard (recommended)";
    this.silentMode = false;
    this.dryRun = false;
    this.logRows = [];
    this.logDetails = [];
}

BatchCncCleanup.prototype = new EAction();

BatchCncCleanup.prototype.beginEvent = function() {
    EAction.prototype.beginEvent.call(this);

    var appWin = EAction.getMainWindow();
    var presetDefault = RSettings.getStringValue("BatchCncCleanup/Preset", this.preset);
    var presetItems = "Standard (recommended),Conservative,Aggressive,Custom,Silent (saved settings)";
    var defaultPresetIndex = 0;
    if (presetDefault === "Conservative") {
        defaultPresetIndex = 1;
    }
    else if (presetDefault === "Aggressive") {
        defaultPresetIndex = 2;
    }
    else if (presetDefault === "Custom") {
        defaultPresetIndex = 3;
    }
    else if (presetDefault === "Silent (saved settings)") {
        defaultPresetIndex = 4;
    }

    this.preset = getItem(
        qsTr("Batch Cleanup Preset"),
        qsTr("Select processing preset"),
        presetItems,
        defaultPresetIndex
    );

    this.silentMode = (this.preset === "Silent (saved settings)");

    if (this.silentMode) {
        this.isolateWarn = RSettings.getBoolValue("BatchCncCleanup/IsolateWarn", false);
        this.tolerance = RSettings.getDoubleValue("BatchCncCleanup/Tolerance", this.tolerance);
        this.clusterTolerance = RSettings.getDoubleValue("BatchCncCleanup/ClusterTolerance", this.clusterTolerance);
        this.dryRun = RSettings.getBoolValue("BatchCncCleanup/DryRun", false);
    }
    else if (this.preset !== "Custom") {
        this.applyPreset(this.preset);
    }
    else {
        var isolateWarnDefault = RSettings.getBoolValue("BatchCncCleanup/IsolateWarn", false);
        var mode = getItem(
            qsTr("Cluster Isolation Mode"),
            qsTr("Select isolation strategy"),
            qsTr("OK only (recommended),OK + WARN (aggressive)"),
            isolateWarnDefault ? 1 : 0
        );
        this.isolateWarn = (mode === qsTr("OK + WARN (aggressive)"));
        RSettings.setValue("BatchCncCleanup/IsolateWarn", this.isolateWarn);

        var tolDefault = RSettings.getDoubleValue("BatchCncCleanup/Tolerance", this.tolerance);
        var clusterTolDefault = RSettings.getDoubleValue("BatchCncCleanup/ClusterTolerance", this.clusterTolerance);

        this.tolerance = getDouble(
            qsTr("Polyline Closing Tolerance"),
            qsTr("Tolerance for closing open polylines"),
            tolDefault,
            3,
            0.0,
            1000.0
        );

        this.clusterTolerance = getDouble(
            qsTr("Cluster Tolerance"),
            qsTr("Tolerance for grouping nearby geometry"),
            clusterTolDefault,
            3,
            0.0,
            1000.0
        );

        RSettings.setValue("BatchCncCleanup/Tolerance", this.tolerance);
        RSettings.setValue("BatchCncCleanup/ClusterTolerance", this.clusterTolerance);
    }

    if (!this.silentMode) {
        var dryRunDefault = RSettings.getBoolValue("BatchCncCleanup/DryRun", false);
        var executionMode = getItem(
            qsTr("Execution Mode"),
            qsTr("Select run mode"),
            qsTr("Normal export (recommended),Dry run (analyze only)"),
            dryRunDefault ? 1 : 0
        );
        this.dryRun = (executionMode === qsTr("Dry run (analyze only)"));
    }
    RSettings.setValue("BatchCncCleanup/DryRun", this.dryRun);

    RSettings.setValue("BatchCncCleanup/Preset", this.preset);

    var inDir = "";
    var outDir = "";
    if (this.silentMode) {
        inDir = RSettings.getStringValue("BatchCncCleanup/InputDir", "");
        outDir = RSettings.getStringValue("BatchCncCleanup/OutputDir", "");
        if (inDir === "" || outDir === "") {
            EAction.handleUserWarning(qsTr("Silent mode requires saved input/output folders. Run once in interactive mode first."));
            this.terminate();
            return;
        }
    }
    else {
        inDir = QFileDialog.getExistingDirectory(appWin, qsTr("Select input folder with DXF/DWG files"), QDir.homePath());
        if (isNull(inDir) || inDir === "") {
            this.terminate();
            return;
        }

        outDir = QFileDialog.getExistingDirectory(appWin, qsTr("Select output folder"), inDir);
        if (isNull(outDir) || outDir === "") {
            this.terminate();
            return;
        }
        RSettings.setValue("BatchCncCleanup/InputDir", inDir);
        RSettings.setValue("BatchCncCleanup/OutputDir", outDir);
    }

    this.processFolder(inDir, outDir);
    this.terminate();
};

BatchCncCleanup.prototype.processFolder = function(inDir, outDir) {
    var dir = new QDir(inDir);
    var files = dir.entryList(["*.dxf", "*.DXF", "*.dwg", "*.DWG"], QDir.Files, QDir.Name);

    if (files.length === 0) {
        EAction.handleUserWarning(qsTr("No DXF/DWG files found in input folder."));
        return;
    }

    for (var i = 0; i < files.length; i++) {
        var absIn = dir.absoluteFilePath(files[i]);
        this.processOne(absIn, outDir);
    }

    var summary = this.writeLogs(outDir);
    EAction.handleUserMessage(
        qsTr("Batch CNC cleanup finished: %1 files, CAM-ready: %2, Validation PASS/PASS_WITH_WARNING/FAIL: %3/%4/%5")
            .arg(summary.total)
            .arg(summary.cam_ready_count)
            .arg(summary.validation_counts.PASS)
            .arg(summary.validation_counts.PASS_WITH_WARNING)
            .arg(summary.validation_counts.FAIL)
    );
};

BatchCncCleanup.prototype.processOne = function(inputFile, outDir) {
    var fi = new QFileInfo(inputFile);
    var storage = new RMemoryStorage();
    var spatialIndex = new RSpatialIndexSimple();
    var doc = new RDocument(storage, spatialIndex);
    var di = new RDocumentInterface(doc);

    var row = {
        input_file: inputFile,
        output_file: "",
        status: "ERROR",
        confidence: "LOW",
        base_score: 0,
        multiplier: 1.0,
        final_score: 0,
        score_gap: 0,
        removed_text: 0,
        removed_dims: 0,
        removed_hatch: 0,
        exploded_items: 0,
        closed_polylines: 0,
        open_polylines_remaining: 0,
        purged_layers: 0,
        purged_blocks: 0,
        candidate_count: 0,
        isolated_entities: 0,
        isolation_mode: this.isolateWarn ? "OK+WARN" : "OK",
        preset: this.preset,
        run_mode: this.silentMode ? "silent" : "interactive",
        execution_mode: this.dryRun ? "dry_run" : "export",
        tolerance: this.tolerance,
        cluster_tolerance: this.clusterTolerance,
        error_classes: "",
        cam_ready: false,
        validation_profile: this.getValidationProfile(),
        validation_result: "",
        validation_reasons: "",
        notes: ""
    };

    var importResult = di.importFile(inputFile);
    if (importResult !== RDocumentInterface.IoErrorNoError) {
        row.notes = "Import failed";
        this.logRows.push(row);
        this.logDetails.push({ file: inputFile, error: "Import failed", io_error: importResult });
        return;
    }

    var removeResult = this.removeUnsupportedEntities(di);
    row.removed_text = removeResult.removedText;
    row.removed_dims = removeResult.removedDim;
    row.removed_hatch = removeResult.removedHatch;

    row.exploded_items = this.explodeBlocksAndSplines(di);
    this.normalizeEntityAttributes(di);
    row.closed_polylines = this.closeOpenPolylines(di, this.tolerance);

    var purgeResult = this.purgeUnused(di);
    row.purged_layers = purgeResult.layers;
    row.purged_blocks = purgeResult.blocks;

    var score = this.scoreDocument(di, row);
    row.base_score = score.baseScore;
    row.multiplier = score.multiplier;
    row.final_score = score.finalScore;
    row.score_gap = score.scoreGap;
    row.confidence = score.confidence;
    row.status = score.status;
    row.open_polylines_remaining = score.openPolylines;
    row.candidate_count = score.candidateCount;

    // cluster isolation (next step):
    // isolate only for high-confidence detections.
    if ((row.status === "OK" || (this.isolateWarn && row.status === "WARN")) && score.bestClusterIds.length > 0) {
        row.isolated_entities = this.isolateToCluster(di, score.bestClusterIds);
        row.notes = row.notes + "; cluster isolation applied";
        var purgeResultAfterIsolation = this.purgeUnused(di);
        row.purged_layers += purgeResultAfterIsolation.layers;
        row.purged_blocks += purgeResultAfterIsolation.blocks;
    }

    var classification = this.classifyErrors(di, row, score);
    row.error_classes = classification.codes.join("|");
    row.cam_ready = classification.camReady;
    var validation = this.evaluateValidation(row, score, classification);
    row.validation_result = validation.result;
    row.validation_reasons = validation.reasons.join("|");

    var suffix = "_cleaned";
    if (row.status === "WARN") {
        suffix = "_cleaned_WARN";
    }
    else if (row.status === "REVIEW") {
        suffix = "_cleaned_REVIEW";
    }

    var outputFile = outDir + QDir.separator + fi.completeBaseName() + suffix + "." + fi.suffix();
    if (this.dryRun) {
        row.output_file = "(dry-run)";
        row.notes = row.notes + "; no export";
    }
    else {
        row.output_file = outputFile;
        if (!di.exportFile(outputFile)) {
            row.status = "ERROR";
            row.notes = "Export failed";
        }
    }

    this.logRows.push(row);
    this.logDetails.push({
        file: inputFile,
        output: row.output_file,
        score: score,
        removed: removeResult,
        purged: {
            before_isolation: purgeResult,
            total: { layers: row.purged_layers, blocks: row.purged_blocks }
        },
        isolated_entities: row.isolated_entities,
        error_classes: classification.codes,
        cam_ready: classification.camReady,
        validation: validation
    });
};

BatchCncCleanup.prototype.removeUnsupportedEntities = function(di) {
    var doc = di.getDocument();
    var ids = doc.queryAllEntities();
    var op = new RDeleteObjectsOperation();

    var ret = { removedText: 0, removedDim: 0, removedHatch: 0 };

    for (var i = 0; i < ids.length; i++) {
        var entity = doc.queryEntity(ids[i]);
        if (isNull(entity)) {
            continue;
        }

        if (isDimensionEntity(entity)) {
            op.deleteObject(entity);
            ret.removedDim++;
        }
        else if (isTextEntity(entity)) {
            op.deleteObject(entity);
            ret.removedText++;
        }
        else if (isHatchEntity(entity)) {
            op.deleteObject(entity);
            ret.removedHatch++;
        }
    }

    if (ret.removedText + ret.removedDim + ret.removedHatch > 0) {
        di.applyOperation(op);
    }

    return ret;
};

BatchCncCleanup.prototype.explodeBlocksAndSplines = function(di) {
    var doc = di.getDocument();
    var totalExploded = 0;
    var options = {
        splineTolerance: 0.01,
        splineSegments: 128,
        ellipseSegments: 64,
        splinesToLineSegments: false,
        textToPolylines: false,
        textSplineToLineOrArc: true,
        multilineTextToSimpleText: true,
        circlesToPolylines: false
    };

    for (var pass = 0; pass < 10; pass++) {
        var ids = doc.queryAllEntities();
        var op = new RAddObjectsOperation();
        var changed = 0;

        for (var i = 0; i < ids.length; i++) {
            var entity = doc.queryEntity(ids[i]);
            if (isNull(entity)) {
                continue;
            }

            if (!isBlockReferenceEntity(entity) && !isSplineEntity(entity)) {
                continue;
            }

            var news = Explode.explodeEntity(entity, options);
            if (isNull(news)) {
                continue;
            }

            for (var k = 0; k < news.length; k++) {
                if (isEntity(news[k])) {
                    op.addObject(news[k], false, true);
                }
                else {
                    var e = shapeToEntity(doc, news[k]);
                    if (!isNull(e)) {
                        e.copyAttributesFrom(getPtr(entity));
                        op.addObject(e, false);
                    }
                }
            }

            op.deleteObject(entity);
            changed++;
        }

        if (changed === 0) {
            break;
        }

        totalExploded += changed;
        di.applyOperation(op);
    }

    return totalExploded;
};

BatchCncCleanup.prototype.normalizeEntityAttributes = function(di) {
    var doc = di.getDocument();
    var ids = doc.queryAllEntities();
    var byLayer = doc.getLinetypeId("BYLAYER");
    var op = new RModifyObjectsOperation();

    for (var i = 0; i < ids.length; i++) {
        var entity = doc.queryEntity(ids[i]);
        if (isNull(entity)) {
            continue;
        }

        entity.setLinetypeId(byLayer);
        entity.setLineweight(RLineweight.WeightByLayer);
        op.addObject(entity, false);
    }

    if (ids.length > 0) {
        di.applyOperation(op);
    }
};

BatchCncCleanup.prototype.closeOpenPolylines = function(di, tolerance) {
    var doc = di.getDocument();
    var ids = doc.queryAllEntities();
    var op = new RModifyObjectsOperation();
    var closed = 0;

    for (var i = 0; i < ids.length; i++) {
        var entity = doc.queryEntity(ids[i]);
        if (isNull(entity) || !isPolylineEntity(entity)) {
            continue;
        }

        if (entity.isClosed()) {
            continue;
        }

        var sp = entity.getStartPoint();
        var ep = entity.getEndPoint();
        if (!isNull(sp) && !isNull(ep) && sp.getDistanceTo(ep) <= tolerance) {
            entity.setClosed(true);
            op.addObject(entity, false);
            closed++;
        }
    }

    if (closed > 0) {
        di.applyOperation(op);
    }

    return closed;
};

BatchCncCleanup.prototype.purgeUnused = function(di) {
    var p = { layers: 0, blocks: 0 };

    for (var rounds = 0; rounds < 5; rounds++) {
        var removedBlocks = this.removeUnusedBlocks(di);
        var removedLayers = this.removeUnusedLayers(di);

        p.blocks += removedBlocks;
        p.layers += removedLayers;

        if (removedBlocks + removedLayers === 0) {
            break;
        }
    }

    return p;
};

BatchCncCleanup.prototype.removeUnusedBlocks = function(di) {
    var doc = di.getDocument();
    var blockIds = doc.queryAllBlocks();
    var op = new RDeleteObjectsOperation();
    var removed = 0;

    for (var i = 0; i < blockIds.length; i++) {
        var block = doc.queryBlock(blockIds[i]);
        if (isNull(block)) {
            continue;
        }

        var blockName = block.getName().toUpperCase();
        if (blockName === RBlock.modelSpaceName.toUpperCase()) {
            continue;
        }

        if (isFunction(block.hasLayout) && block.hasLayout()) {
            continue;
        }

        var refs = doc.queryBlockReferences(block.getId());
        if (refs.length === 0) {
            op.deleteObject(block);
            removed++;
        }
    }

    if (removed > 0) {
        di.applyOperation(op);
    }

    return removed;
};

BatchCncCleanup.prototype.removeUnusedLayers = function(di) {
    var doc = di.getDocument();
    var layerIds = doc.queryAllLayers();
    var op = new RDeleteObjectsOperation();
    var removed = 0;

    for (var i = 0; i < layerIds.length; i++) {
        var layer = doc.queryLayer(layerIds[i]);
        if (isNull(layer)) {
            continue;
        }

        var layerName = layer.getName().toUpperCase();
        if (layerName === "0" || layerName === "DEFPOINTS") {
            continue;
        }

        if (layer.getId() === doc.getCurrentLayerId()) {
            continue;
        }

        var layerEntities = doc.queryLayerEntities(layer.getId());
        if (layerEntities.length === 0) {
            op.deleteObject(layer);
            removed++;
        }
    }

    if (removed > 0) {
        di.applyOperation(op);
    }

    return removed;
};

BatchCncCleanup.prototype.scoreDocument = function(di, row) {
    var doc = di.getDocument();
    var ids = doc.queryAllEntities();

    var allowedEntityIds = [];
    var nonAllowed = 0;
    var openPolylines = 0;

    var textRemaining = 0;
    var dimRemaining = 0;
    var hatchRemaining = 0;
    var drawingBox = doc.getBoundingBox();

    for (var i = 0; i < ids.length; i++) {
        var e = doc.queryEntity(ids[i]);
        if (isNull(e)) {
            continue;
        }

        var allowedType = isLineEntity(e) || isArcEntity(e) || isCircleEntity(e) || isEllipseEntity(e) || isPolylineEntity(e);
        if (allowedType) {
            allowedEntityIds.push(ids[i]);
        }
        else {
            nonAllowed++;
        }

        if (isTextEntity(e)) {
            textRemaining++;
        }
        if (isDimensionEntity(e)) {
            dimRemaining++;
        }
        if (isHatchEntity(e)) {
            hatchRemaining++;
        }
        if (isPolylineEntity(e) && !e.isClosed()) {
            openPolylines++;
        }
    }

    var clusters = this.buildGeometryClusters(doc, allowedEntityIds, this.clusterTolerance);
    var scoredClusters = [];
    for (var c = 0; c < clusters.length; c++) {
        scoredClusters.push(this.scoreCluster(doc, clusters[c], drawingBox, openPolylines, textRemaining, dimRemaining, hatchRemaining, nonAllowed));
    }
    scoredClusters.sort(function(a, b) {
        return b.finalScore - a.finalScore;
    });

    var best = scoredClusters.length > 0 ? scoredClusters[0] : undefined;
    var second = scoredClusters.length > 1 ? scoredClusters[1] : undefined;

    var baseScore = (best === undefined) ? 0 : best.baseScore;
    var multiplier = (best === undefined) ? 1.0 : best.multiplier;
    var finalScore = (best === undefined) ? 0 : best.finalScore;
    var outerContourFound = (best === undefined) ? false : best.outerContourFound;
    var scoreGap = (best === undefined) ? 0 : ((second === undefined) ? best.finalScore : best.finalScore - second.finalScore);

    var status = "REVIEW";
    var confidence = "LOW";

    if (outerContourFound && finalScore >= 70 && scoreGap >= 12) {
        status = "OK";
        confidence = "HIGH";
    }
    else if (finalScore >= 55) {
        status = "WARN";
        confidence = "MEDIUM";
    }

    row.notes = outerContourFound ? "Outer contour candidate found" : "No reliable outer contour";
    if (clusters.length === 0) {
        row.notes = "No valid geometry clusters";
    }

    return {
        baseScore: baseScore,
        multiplier: multiplier,
        finalScore: finalScore,
        scoreGap: scoreGap,
        status: status,
        confidence: confidence,
        openPolylines: openPolylines,
        candidateCount: clusters.length,
        bestClusterIds: (best === undefined) ? [] : best.clusterIds,
        nonAllowedRemaining: nonAllowed
    };
};

BatchCncCleanup.prototype.classifyErrors = function(di, row, score) {
    var codes = [];

    if (score.openPolylines > 0) {
        codes.push("OPEN_CONTOURS");
    }
    if (score.nonAllowedRemaining > 0) {
        codes.push("UNSUPPORTED_ENTITY_TYPES");
    }
    if (score.candidateCount === 0) {
        codes.push("NO_MAIN_CLUSTER");
    }
    if (row.status === "WARN") {
        codes.push("MEDIUM_CONFIDENCE_AUTODETECT");
    }
    if (row.status === "REVIEW") {
        codes.push("LOW_CONFIDENCE_AUTODETECT");
    }

    var blocking = {
        OPEN_CONTOURS: true,
        UNSUPPORTED_ENTITY_TYPES: true,
        NO_MAIN_CLUSTER: true
    };

    var camReady = true;
    for (var i = 0; i < codes.length; i++) {
        if (blocking[codes[i]] === true) {
            camReady = false;
            break;
        }
    }
    if (row.status === "REVIEW" || row.status === "ERROR") {
        camReady = false;
    }

    return {
        codes: codes,
        camReady: camReady
    };
};

BatchCncCleanup.prototype.getValidationProfile = function() {
    if (this.preset === "Conservative") {
        return "conservative";
    }
    if (this.preset === "Aggressive") {
        return "aggressive";
    }
    return "standard";
};

BatchCncCleanup.prototype.evaluateValidation = function(row, score, classification) {
    var reasons = [];
    var fail = false;

    if (!classification.camReady) {
        reasons.push("CAM_NOT_READY");
        fail = true;
    }
    if (row.status === "ERROR") {
        reasons.push("STATUS_ERROR");
        fail = true;
    }
    if (row.status === "REVIEW") {
        reasons.push("STATUS_REVIEW");
        fail = true;
    }

    var profile = row.validation_profile;
    var minScore = 55;
    if (profile === "conservative") {
        minScore = 65;
    }
    else if (profile === "aggressive") {
        minScore = 45;
    }

    if (row.final_score < minScore) {
        reasons.push("LOW_SCORE_PROFILE");
    }

    if (fail) {
        return {
            result: "FAIL",
            reasons: reasons
        };
    }

    if (row.status === "WARN") {
        reasons.push("STATUS_WARN");
        return {
            result: "PASS_WITH_WARNING",
            reasons: reasons
        };
    }

    if (reasons.length > 0) {
        return {
            result: "PASS_WITH_WARNING",
            reasons: reasons
        };
    }

    return {
        result: "PASS",
        reasons: []
    };
};

BatchCncCleanup.prototype.applyPreset = function(name) {
    if (name === "Conservative") {
        this.isolateWarn = false;
        this.tolerance = 0.05;
        this.clusterTolerance = 0.10;
    }
    else if (name === "Aggressive") {
        this.isolateWarn = true;
        this.tolerance = 0.20;
        this.clusterTolerance = 0.50;
    }
    else {
        // Standard (recommended)
        this.isolateWarn = false;
        this.tolerance = 0.10;
        this.clusterTolerance = 0.25;
    }

    RSettings.setValue("BatchCncCleanup/IsolateWarn", this.isolateWarn);
    RSettings.setValue("BatchCncCleanup/Tolerance", this.tolerance);
    RSettings.setValue("BatchCncCleanup/ClusterTolerance", this.clusterTolerance);
};

BatchCncCleanup.prototype.isolateToCluster = function(di, keepIds) {
    var doc = di.getDocument();
    var ids = doc.queryAllEntities();
    var op = new RDeleteObjectsOperation();
    var removed = 0;
    var keepMap = {};

    for (var i = 0; i < keepIds.length; i++) {
        keepMap[keepIds[i]] = true;
    }

    for (var k = 0; k < ids.length; k++) {
        var id = ids[k];
        var e = doc.queryEntity(id);
        if (isNull(e)) {
            continue;
        }

        var allowedType = isLineEntity(e) || isArcEntity(e) || isCircleEntity(e) || isEllipseEntity(e) || isPolylineEntity(e);
        if (!allowedType) {
            continue;
        }

        if (keepMap[id] !== true) {
            op.deleteObject(e);
            removed++;
        }
    }

    if (removed > 0) {
        di.applyOperation(op);
    }

    return removed;
};

BatchCncCleanup.prototype.buildGeometryClusters = function(doc, entityIds, tolerance) {
    var clusters = [];
    var visited = {};
    var boxes = {};

    for (var i = 0; i < entityIds.length; i++) {
        var id = entityIds[i];
        var e = doc.queryEntity(id);
        if (isNull(e)) {
            continue;
        }
        var box = e.getBoundingBox();
        if (isNull(box)) {
            continue;
        }
        boxes[id] = box.grow(tolerance);
    }

    for (var i2 = 0; i2 < entityIds.length; i2++) {
        var seedId = entityIds[i2];
        if (visited[seedId] === true || isNull(boxes[seedId])) {
            continue;
        }

        var q = [seedId];
        visited[seedId] = true;
        var cluster = [];

        while (q.length > 0) {
            var currentId = q.pop();
            cluster.push(currentId);

            for (var k = 0; k < entityIds.length; k++) {
                var otherId = entityIds[k];
                if (visited[otherId] === true || isNull(boxes[otherId])) {
                    continue;
                }
                if (this.boxesIntersect(boxes[currentId], boxes[otherId])) {
                    visited[otherId] = true;
                    q.push(otherId);
                }
            }
        }

        if (cluster.length > 0) {
            clusters.push(cluster);
        }
    }

    return clusters;
};

BatchCncCleanup.prototype.boxesIntersect = function(a, b) {
    var amin = a.getMinimum();
    var amax = a.getMaximum();
    var bmin = b.getMinimum();
    var bmax = b.getMaximum();
    return !(amax.x < bmin.x || bmax.x < amin.x || amax.y < bmin.y || bmax.y < amin.y);
};

BatchCncCleanup.prototype.scoreCluster = function(doc, clusterIds, drawingBox, openPolylines, textRemaining, dimRemaining, hatchRemaining, nonAllowed) {
    var allowed = clusterIds.length;
    var outerContourFound = false;
    var bestArea = -1;
    var bestBox = undefined;

    for (var i = 0; i < clusterIds.length; i++) {
        var e = doc.queryEntity(clusterIds[i]);
        if (isNull(e)) {
            continue;
        }

        var candidateClosed = false;
        if (isCircleEntity(e) || isEllipseEntity(e)) {
            candidateClosed = true;
        }
        else if (isPolylineEntity(e)) {
            candidateClosed = e.isClosed();
        }

        if (!candidateClosed) {
            continue;
        }

        var b = e.getBoundingBox();
        if (isNull(b)) {
            continue;
        }

        var area = b.getArea();
        if (area > bestArea) {
            bestArea = area;
            bestBox = b;
            outerContourFound = true;
        }
    }

    var baseScore = 0;

    if (outerContourFound) {
        var closedScore = 40;
        if (openPolylines > 0) {
            closedScore = Math.max(20, 40 - Math.min(20, openPolylines));
        }
        baseScore += closedScore;
    }

    var cleanScore = 0;
    cleanScore += (textRemaining === 0 ? 6 : 0);
    cleanScore += (dimRemaining === 0 ? 6 : 0);
    cleanScore += (hatchRemaining === 0 ? 4 : 0);
    cleanScore += 5;
    cleanScore += 4;
    baseScore += cleanScore;

    var layersCount = doc.queryAllLayers().length;
    var blocksCount = doc.queryAllBlocks().length;
    baseScore += Math.max(0, 8 - Math.max(0, layersCount - 3));
    baseScore += Math.max(0, 7 - Math.max(0, blocksCount - 2));

    var total = allowed + nonAllowed;
    var allowedRatio = total === 0 ? 0 : allowed / total;
    baseScore += Math.round(10 * allowedRatio);
    if (allowed > 0 && allowedRatio > 0.8) {
        baseScore += 5;
    }

    var penalty = 0;
    if (outerContourFound && !isNull(drawingBox) && !isNull(bestBox) && drawingBox.getArea() > RS.PointTolerance) {
        var cover = bestBox.getArea() / drawingBox.getArea();
        var w = bestBox.getWidth();
        var h = bestBox.getHeight();
        var ar = (w > RS.PointTolerance && h > RS.PointTolerance) ? Math.max(w, h) / Math.min(w, h) : 1.0;
        if (cover > 0.90 && ar > 1.2) {
            penalty -= 20;
        }
        if (cover > 0.95) {
            penalty -= 5;
        }
    }
    baseScore += penalty;

    var multiplier = 1.0;
    var artifacts = textRemaining + dimRemaining + hatchRemaining;
    if (artifacts > 0) {
        multiplier = 0.85;
    }
    if (artifacts > 20) {
        multiplier = 0.65;
    }

    var finalScore = Math.max(0, Math.round(baseScore * multiplier));
    return {
        baseScore: baseScore,
        finalScore: finalScore,
        multiplier: multiplier,
        outerContourFound: outerContourFound,
        clusterIds: clusterIds
    };
};

BatchCncCleanup.prototype.writeLogs = function(outDir) {
    var csvPath = outDir + QDir.separator + "batch_cleanup_log.csv";
    var jsonPath = outDir + QDir.separator + "batch_cleanup_log.json";
    var summaryPath = outDir + QDir.separator + "batch_cleanup_summary.json";

    this.writeCsv(csvPath);
    this.writeJson(jsonPath);
    var summary = this.buildRunSummary();
    this.writeSummary(summaryPath, summary);
    return summary;
};

BatchCncCleanup.prototype.buildRunSummary = function() {
    var summary = {
        total: this.logRows.length,
        cam_ready_count: 0,
        not_cam_ready_count: 0,
        status_counts: { OK: 0, WARN: 0, REVIEW: 0, ERROR: 0 },
        validation_counts: { PASS: 0, PASS_WITH_WARNING: 0, FAIL: 0 },
        execution_mode_counts: { export: 0, dry_run: 0 },
        run_mode_counts: { interactive: 0, silent: 0 },
        top_error_classes: [],
        top_fail_reasons: []
    };

    var errorClassCounts = {};
    var failReasonCounts = {};
    for (var i = 0; i < this.logRows.length; i++) {
        var r = this.logRows[i];

        if (r.cam_ready) {
            summary.cam_ready_count++;
        }
        else {
            summary.not_cam_ready_count++;
        }

        if (summary.status_counts[r.status] === undefined) {
            summary.status_counts[r.status] = 0;
        }
        summary.status_counts[r.status]++;

        if (summary.validation_counts[r.validation_result] === undefined) {
            summary.validation_counts[r.validation_result] = 0;
        }
        summary.validation_counts[r.validation_result]++;

        if (summary.execution_mode_counts[r.execution_mode] === undefined) {
            summary.execution_mode_counts[r.execution_mode] = 0;
        }
        summary.execution_mode_counts[r.execution_mode]++;

        if (summary.run_mode_counts[r.run_mode] === undefined) {
            summary.run_mode_counts[r.run_mode] = 0;
        }
        summary.run_mode_counts[r.run_mode]++;

        if (!isNull(r.error_classes) && r.error_classes !== "") {
            var parts = String(r.error_classes).split("|");
            for (var k = 0; k < parts.length; k++) {
                var c = parts[k];
                if (c === "") {
                    continue;
                }
                if (errorClassCounts[c] === undefined) {
                    errorClassCounts[c] = 0;
                }
                errorClassCounts[c]++;
            }
        }

        if (!isNull(r.validation_reasons) && r.validation_reasons !== "") {
            var reasons = String(r.validation_reasons).split("|");
            for (var m = 0; m < reasons.length; m++) {
                var rc = reasons[m];
                if (rc === "") {
                    continue;
                }
                if (failReasonCounts[rc] === undefined) {
                    failReasonCounts[rc] = 0;
                }
                failReasonCounts[rc]++;
            }
        }
    }

    var errorClassArr = [];
    for (var key in errorClassCounts) {
        if (!errorClassCounts.hasOwnProperty(key)) {
            continue;
        }
        errorClassArr.push({ code: key, count: errorClassCounts[key] });
    }
    errorClassArr.sort(function(a, b) {
        return b.count - a.count;
    });
    summary.top_error_classes = errorClassArr;

    var failReasonArr = [];
    for (var key2 in failReasonCounts) {
        if (!failReasonCounts.hasOwnProperty(key2)) {
            continue;
        }
        failReasonArr.push({ code: key2, count: failReasonCounts[key2] });
    }
    failReasonArr.sort(function(a, b) {
        return b.count - a.count;
    });
    summary.top_fail_reasons = failReasonArr;

    return summary;
};

BatchCncCleanup.prototype.writeSummary = function(path, summary) {
    var file = new QFile(path);
    if (!file.open(QIODevice.WriteOnly | QIODevice.Text | QIODevice.Truncate)) {
        EAction.handleUserWarning(qsTr("Cannot write summary JSON: %1").arg(path));
        return;
    }

    var ts = new QTextStream(file);
    setUtf8Codec(ts);
    ts.writeString(JSON.stringify(summary, null, 2));
    file.close();
};

BatchCncCleanup.prototype.writeCsv = function(path) {
    var file = new QFile(path);
    if (!file.open(QIODevice.WriteOnly | QIODevice.Text | QIODevice.Truncate)) {
        EAction.handleUserWarning(qsTr("Cannot write CSV log: %1").arg(path));
        return;
    }

    var ts = new QTextStream(file);
    setUtf8Codec(ts);
    ts.writeString("input_file,output_file,status,confidence,cam_ready,error_classes,validation_profile,validation_result,validation_reasons,base_score,multiplier,final_score,score_gap,removed_text,removed_dims,removed_hatch,exploded_items,closed_polylines,open_polylines_remaining,purged_layers,purged_blocks,candidate_count,isolated_entities,isolation_mode,preset,run_mode,execution_mode,tolerance,cluster_tolerance,notes\n");

    for (var i = 0; i < this.logRows.length; i++) {
        var r = this.logRows[i];
        var line = [
            this.csvEscape(r.input_file),
            this.csvEscape(r.output_file),
            r.status,
            r.confidence,
            r.cam_ready ? "true" : "false",
            this.csvEscape(r.error_classes),
            r.validation_profile,
            r.validation_result,
            this.csvEscape(r.validation_reasons),
            r.base_score,
            r.multiplier,
            r.final_score,
            r.score_gap,
            r.removed_text,
            r.removed_dims,
            r.removed_hatch,
            r.exploded_items,
            r.closed_polylines,
            r.open_polylines_remaining,
            r.purged_layers,
            r.purged_blocks,
            r.candidate_count,
            r.isolated_entities,
            r.isolation_mode,
            r.preset,
            r.run_mode,
            r.execution_mode,
            r.tolerance,
            r.cluster_tolerance,
            this.csvEscape(r.notes)
        ].join(",");

        ts.writeString(line + "\n");
    }

    file.close();
};

BatchCncCleanup.prototype.writeJson = function(path) {
    var file = new QFile(path);
    if (!file.open(QIODevice.WriteOnly | QIODevice.Text | QIODevice.Truncate)) {
        EAction.handleUserWarning(qsTr("Cannot write JSON log: %1").arg(path));
        return;
    }

    var ts = new QTextStream(file);
    setUtf8Codec(ts);
    ts.writeString(JSON.stringify(this.logDetails, null, 2));
    file.close();
};

BatchCncCleanup.prototype.csvEscape = function(s) {
    if (isNull(s)) {
        return "";
    }

    var t = String(s);
    if (t.indexOf(",") !== -1 || t.indexOf("\"") !== -1 || t.indexOf("\n") !== -1) {
        t = t.replace(/\"/g, "\"\"");
        return "\"" + t + "\"";
    }
    return t;
};
