'use strict';

/**
 * This class contains the current objects that are rendering. 
 * @class CurrentObjectsRendering
 */
var CurrentObjectsRendering = function() 
{
	if (!(this instanceof CurrentObjectsRendering)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The current node that is in rendering process.
	 * @type {Node}
	 * @default undefined
	 */
	this.curNode = undefined;
	
	/**
	 * The current building that is in rendering process.
	 * @type {NeoBuilding}
	 * @default undefined
	 */
	this.curBuilding = undefined;
	
	/**
	 * The current octree (octree of a building) that is in rendering process.
	 * @type {Octree}
	 * @default undefined
	 */
	this.curOctree = undefined;
	
	/**
	 * The current object that is in rendering process.
	 * @type {NeoReference}
	 * @default undefined
	 */
	this.curObject = undefined;
};


/**
 * This class manages the rendering of all classes.
 * @class Renderer
 */
var Renderer = function(manoManager) 
{
	if (!(this instanceof Renderer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The current objects that is in rendering process.
	 * @type {CurrentObjectsRendering}
	 * @default CurrentObjectsRendering
	 */
	this.currentObjectsRendering = new CurrentObjectsRendering();
	
	/**
	 * This parameter indicates that if is using normals in the shader.
	 * @type {Boolean}
	 * @default true
	 */
	this.renderNormals = true;
	
	/**
	 * This parameter indicates that if is using textures in the shader.
	 * @type {Boolean}
	 * @default true
	 */
	this.renderTexture = true;
	
	/**
	 * The main mago3d class. This object manages the main pipe-line of the Mago3D.
	 * @type {ManoManager}
	 * @default ManoManager
	 */
	this.magoManager = manoManager;
};

/**
 * This function renders all nodes of "visibleNodesArray".
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Array} visibleNodesArray Array that contains the nodes to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Boolean} renderTexture This parameter indicates that if is using textures in the shader.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {Number} maxSizeToRender This parameter limites the minimum size in the rendering process.
 * @param {Number} refMatrixIdxKey Indicates the references transformation matrix index.
 */
Renderer.prototype.renderNodes = function(gl, visibleNodesArray, magoManager, shader, renderTexture, renderType, maxSizeToRender, refMatrixIdxKey) 
{
	var node;
	var rootNode;
	var geoLocDataManager;
	var neoBuilding;
	var minSize = 0.0;
	var lowestOctreesCount;
	var lowestOctree;
	var isInterior = false; // no used.
	
	// set webgl options.
	gl.enable(gl.DEPTH_TEST);
	if (MagoConfig.getPolicy().geo_cull_face_enable === "true") 
	{
		gl.enable(gl.CULL_FACE);
	}
	else 
	{
		gl.disable(gl.CULL_FACE);
	}

	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	
	if (renderType === 2)
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
	}
	if (renderType === 0)
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc);
	}
	
	var flipYTexCoord = false;
	
	// do render.
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		node.renderContent(magoManager, shader, renderType, refMatrixIdxKey);
	}
};

/**
 * This function returns the vertices count recommended to render for determined distance to camera.
 * @param {Number} distToCam WebGL Rendering Context.
 * @param {Number} realPointsCount The real current points count.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
Renderer.prototype.getPointsCountForDistance = function(distToCam, realPointsCount, magoManager) 
{
	var vertices_count = realPointsCount;
	var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
		
	if (distToCam <= 10)
	{
		// Render all points.
	}
	else if (distToCam < 100)
	{
		vertices_count = Math.floor(pCloudSettings.MaxPerUnitPointsRenderDistToCam100m * realPointsCount);
	}
	else if (distToCam < 200)
	{
		vertices_count = Math.floor(pCloudSettings.MaxPerUnitPointsRenderDistToCam200m * realPointsCount);
	}
	else if (distToCam < 400)
	{
		vertices_count = Math.floor(pCloudSettings.MaxPerUnitPointsRenderDistToCam400m * realPointsCount);
	}
	else if (distToCam < 800)
	{
		vertices_count = Math.floor(pCloudSettings.MaxPerUnitPointsRenderDistToCam800m * realPointsCount);
	}
	else if (distToCam < 1600)
	{
		vertices_count = Math.floor(pCloudSettings.MaxPerUnitPointsRenderDistToCam1600m * realPointsCount);
	}
	else
	{
		vertices_count = Math.floor(pCloudSettings.MaxPerUnitPointsRenderDistToCamMoreThan1600m * realPointsCount);
	}
	
	return vertices_count;
};

/**
 * This function renders the pCloud object. The pCloud object is "Lego" class.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Lego} pCloud The points cloud data to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {Number} distToCam The current distance to camera.
 */
Renderer.prototype.renderPCloud = function(gl, pCloud, magoManager, shader, renderType, distToCam) 
{
	// Note: "pCloud" is "Lego" class.
	if (pCloud.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	gl.frontFace(gl.CCW);
	
	var vbo_vicky = pCloud.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;
	
	if (vertices_count === 0) 
	{ return; }
	
	var pointsCountToDraw = this.getPointsCountForDistance(distToCam, vertices_count, magoManager);
	
	if (magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
	{
		pointsCountToDraw = Math.floor(pointsCountToDraw/5);
	}

	if (pointsCountToDraw <= 0)
	{ return; }

	if (renderType === 0) // depth.
	{
		// 1) Position.
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		gl.drawArrays(gl.POINTS, 0, pointsCountToDraw);
	}
	else if (renderType === 1) // color.
	{
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		gl.drawArrays(gl.POINTS, 0, pointsCountToDraw);
		
	}
	
	
};

/**
 * This function renders the neoBuildings as points-cloud projects.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Array} visibleNodesArray Array that contains the nodes to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Boolean} renderTexture This parameter indicates that if is using textures in the shader.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 */
Renderer.prototype.renderNeoBuildingsPCloud = function(gl, visibleNodesArray, magoManager, shader, renderTexture, renderType) 
{
	var node;
	var rootNode;
	var geoLocDataManager;
	var neoBuilding;
	var lowestOctreesCount;
	var lowestOctree;
	var lastExtureId;
	
	// Do some gl settings.
	//gl.uniform1i(shader.bUse1Color_loc, false);
	gl.uniform1f(shader.fixPointSize_loc, 1.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, false);
	
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		
		rootNode = node.getRoot();
		geoLocDataManager = rootNode.data.geoLocDataManager;
		neoBuilding = node.data.neoBuilding;
		
		if (neoBuilding === undefined)
		{ continue; }
		
		if (neoBuilding.octree === undefined)
		{ continue; }

		var projectDataType = neoBuilding.metaData.projectDataType;
		
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		if (projectDataType !== undefined && projectDataType === 5)
		{
			if (magoManager.myCameraRelative === undefined)
			{ magoManager.myCameraRelative = new Camera(); }

			var relativeCam = magoManager.myCameraRelative;
			relativeCam.frustum.copyParametersFrom(magoManager.myCameraSCX.bigFrustum);
			relativeCam = buildingGeoLocation.getTransformedRelativeCamera(magoManager.sceneState.camera, relativeCam);
			relativeCam.calculateFrustumsPlanes();
			var renderType = renderType;// testing.
			var bPrepareData = true;
			
			neoBuilding.octree.test__renderPCloud(magoManager, neoBuilding, renderType, shader, relativeCam, bPrepareData);
		}
	}
	
	shader.disableVertexAttribArrayAll();
};

/**
 * This function enables the webgl stencil-test option.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.enableStencilBuffer = function(gl)
{
	// Active stencil if the object is selected.
	gl.enable(gl.STENCIL_TEST);
	
	gl.stencilFunc(gl.ALWAYS, 1, 1);
	// (stencil-fail: replace), (stencil-pass & depth-fail: replace), (stencil-pass & depth-pass: replace).
	//gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
	gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
	gl.enable(gl.POLYGON_OFFSET_FILL);
};

/**
 * This function disables the webgl stencil-test option.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.disableStencilBuffer = function(gl)
{
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
	gl.disable(gl.POLYGON_OFFSET_FILL);
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {ParametricMesh} renderable ParametricMesh type object to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {Boolean} bRenderLines Optional boolean. Indicates if render edges.
 */
Renderer.prototype.renderObject = function(gl, renderable, magoManager, shader, renderType, bRenderLines)
{
	// This function actually is used for axis (origin) object.
	var vbo_vicks_container = renderable.getVboKeysContainer();
	
	if (vbo_vicks_container === undefined)
	{ return; }
	
	if (vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{ return; }
	

	if (bRenderLines === undefined)
	{ bRenderLines = false; }


	var vbosCount = vbo_vicks_container.getVbosCount();
	for (var i=0; i<vbosCount; i++)
	{
		
		
		// 1) Position.
		var vbo_vicky = vbo_vicks_container.vboCacheKeysArray[i]; // there are only one.

		var vertices_count = vbo_vicky.vertexCount;
		if (vertices_count === 0) 
		{ return; }

		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (renderType === 1) // ssao.
		{
			if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }

			if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
			{ return false; }
			
			// TexCoords todo:
		}
		
		if (bRenderLines === false)
		{
			if (vbo_vicky.indicesCount > 0)
			{
				if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
				{ return false; }

				gl.drawElements(gl.TRIANGLES, vbo_vicky.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
			}
			else 
			{
				gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
			}
		}
		else 
		{
			gl.drawArrays(gl.LINE_STRIP, 0, vertices_count);
			//gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		}
		
		
		
		var glError = gl.getError();
		if (glError !== gl.NO_ERROR)
		{ var hola = 0; }
	}
};


/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryDepth = function(gl, renderType, visibleObjControlerNodes) 
{
	var currentShader;
	var shaderProgram;
	var renderTexture = false;
	
	var magoManager = this.magoManager;
	
	// Test Modeler Rendering.********************************************************************
	// Test Modeler Rendering.********************************************************************
	// Test Modeler Rendering.********************************************************************
	if (magoManager.modeler !== undefined)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		currentShader.resetLastBuffersBinded();
		shaderProgram = currentShader.program;

		currentShader.useProgram();
		currentShader.disableVertexAttribArrayAll();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);

		currentShader.bindUniformGenerals();

		var refTMatrixIdxKey = 0;
		var minSizeToRender = 0.0;
		var renderType = 0;
		var refMatrixIdxKey =0; // provisionally set this var here.***
		magoManager.modeler.render(magoManager, currentShader, renderType);

		currentShader.disableVertexAttribArrayAll();
		gl.useProgram(null);

	}
	
	var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;
	var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
	var nodesLOD3Count = visibleObjControlerNodes.currentVisibles3.length;
	if (nodesLOD0Count > 0 || nodesLOD2Count > 0 || nodesLOD3Count > 0)
	{
		// Make depth buffer only for closest frustum.
		if (magoManager.currentFrustumIdx === 0)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
			currentShader.resetLastBuffersBinded();
			shaderProgram = currentShader.program;

			currentShader.useProgram();
			currentShader.disableVertexAttribArrayAll();
			currentShader.enableVertexAttribArray(currentShader.position3_loc);

			currentShader.bindUniformGenerals();

			// RenderDepth for all buildings.***
			var refTMatrixIdxKey = 0;
			var minSize = 0.0;

			magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
			//magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
			//magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
			
			currentShader.disableVertexAttribArray(currentShader.position3_loc); 
			gl.useProgram(null);
		}
	}
	
	// PointsCloud.****************************************************************************************
	// PointsCloud.****************************************************************************************
	var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
	if (nodesPCloudCount > 0)
	{
		currentShader = magoManager.postFxShadersManager.getShader("pointsCloudDepth");
		currentShader.useProgram();
		
		currentShader.resetLastBuffersBinded();
		currentShader.disableVertexAttribArrayAll();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		
		currentShader.bindUniformGenerals();
		var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
		gl.uniform1f(currentShader.maxPointSize_loc, pCloudSettings.maxPointSize);
		
		// Test to load pCloud.***
		if (magoManager.visibleObjControlerPCloudOctrees === undefined)
		{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
		magoManager.visibleObjControlerPCloudOctrees.clear();

		magoManager.renderer.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShader, renderTexture, renderType); 
		currentShader.disableVertexAttribArrayAll();
		
		gl.useProgram(null);
		
		// Load pCloud data.***
		var visiblesSortedOctreesArray = magoManager.visibleObjControlerPCloudOctrees.currentVisibles0;
		var octreesCount = visiblesSortedOctreesArray.length;

		var loadCount = 0;
		if (!magoManager.isCameraMoving && !magoManager.mouseLeftDown && !magoManager.mouseMiddleDown)
		{
			for (var i=0; i<octreesCount; i++)
			{
				var octree = visiblesSortedOctreesArray[i];
				if (octree.preparePCloudData(magoManager))
				{
					loadCount++;
				}
				
				if (loadCount > 1)
				{ break; }
			}
		}

	}
	
	// Render cuttingPlanes of temperaturalayers if exist.***
	if (magoManager.weatherStation)
	{ magoManager.weatherStation.test_renderCuttingPlanes(magoManager, renderType); }
	
	// tin terrain.***
	if (magoManager.tinTerrainManager !== undefined)
	{
		var bDepth = true;
		magoManager.tinTerrainManager.render(magoManager, bDepth);
		gl.useProgram(null);
	}
	
	// Test.***
	var selGeneralObjects = magoManager.selectionManager.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		if (currObjectSelected)
		{
			// check if is a cuttingPlane.***
			if (currObjectSelected instanceof CuttingPlane)
			{
				// Test. Render depth only for the selected object.***************************
				magoManager.test_renderDepth_objectSelected(currObjectSelected);
			}
		}
	}
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometry = function(gl, renderType, visibleObjControlerNodes) 
{
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	var currentShader;
	var shaderProgram;
	var neoBuilding;
	var node;
	var rootNode;
	var geoLocDataManager;
	var magoManager = this.magoManager;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	var renderTexture = false;
	
	if (renderType === 0 ) 
	{
		gl.disable(gl.BLEND);
		magoManager.renderer.renderGeometryDepth(gl, renderType, visibleObjControlerNodes);
		
		// Draw the axis.***
		if (magoManager.magoPolicy.getShowOrigin() && magoManager.nodeSelected !== undefined)
		{
			node = magoManager.nodeSelected;
			var nodes = [node];
			
			this.renderAxisNodes(nodes, renderType);
		}
	}
	if (renderType === 1) 
	{
		var textureAux1x1 = magoManager.texturesManager.getTextureAux1x1();
		var noiseTexture = magoManager.texturesManager.getNoiseTexture4x4();
		
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		if (magoManager.modeler !== undefined)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao default.***
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			currentShader.last_tex_id = textureAux1x1;
			
			
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			magoManager.modeler.render(magoManager, currentShader, renderType);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);
		}
		
		// check changesHistory.
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles0);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles0);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles2);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles3);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles3);
			
		// ssao render.************************************************************************************************************
		var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;
		var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
		var nodesLOD3Count = visibleObjControlerNodes.currentVisibles3.length;
		if (nodesLOD0Count > 0 || nodesLOD2Count > 0 || nodesLOD3Count > 0)
		{
			gl.enable(gl.BLEND);
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			var bApplySsao = false;
			if (magoManager.currentFrustumIdx === 0)
			{ bApplySsao = true; }
			
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			currentShader.last_tex_id = textureAux1x1;
			
			
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			bApplySsao = false;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 

			magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);
		}
		
		// If there are an object selected, then there are a stencilBuffer.******************************************
		if (magoManager.nodeSelected) // if there are an object selected then there are a building selected.***
		{
			if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.OBJECT && magoManager.objectSelected)
			{
				node = magoManager.nodeSelected;
				var geoLocDataManager = node.getNodeGeoLocDataManager();
				neoBuilding = magoManager.buildingSelected;
				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				var neoReferencesMotherAndIndices = magoManager.octreeSelected.neoReferencesMotherAndIndices;
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				
				// do as the "getSelectedObjectPicking".**********************************************************
				currentShader = magoManager.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
				currentShader.useProgram();
				
				currentShader.enableVertexAttribArray(currentShader.position3_loc);
				currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
				currentShader.disableVertexAttribArray(currentShader.normal3_loc);
				currentShader.disableVertexAttribArray(currentShader.color4_loc);
				
				buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, magoManager.sceneState.modelViewRelToEyeMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
				
				// do the colorCoding render.***
				
				gl.uniform4fv(currentShader.color4Aux_loc, [0.0, 1.0, 0.0, 1.0]);
				gl.uniform2fv(currentShader.screenSize_loc, [magoManager.sceneState.drawingBufferWidth, magoManager.sceneState.drawingBufferHeight]);
				gl.uniformMatrix4fv(currentShader.ProjectionMatrix_loc, false, magoManager.sceneState.projectionMatrix._floatArrays);
				
				gl.enable(gl.STENCIL_TEST);
				gl.disable(gl.POLYGON_OFFSET_FILL);
				gl.disable(gl.CULL_FACE);
				gl.disable(gl.DEPTH_TEST);
				gl.depthRange(0, 0);
				
				gl.stencilFunc(gl.EQUAL, 0, 1);
				gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
					
				//glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				//gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );
				var localRenderType = 0; // only need positions.***
				var minSizeToRender = 0.0;
				var offsetSize = 3/1000;
				
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
				magoManager.objectSelected.render(magoManager, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
				magoManager.objectSelected.render(magoManager, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
				magoManager.objectSelected.render(magoManager, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
				magoManager.objectSelected.render(magoManager, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				
				gl.enable(gl.DEPTH_TEST);// return to the normal state.***
				gl.disable(gl.STENCIL_TEST);
				gl.depthRange(0, 1);// return to the normal value.***
				//gl.disableVertexAttribArray(currentShader.position3_loc);
				currentShader.disableVertexAttribArrayAll();
				
				gl.useProgram(null);
			}
			
			// new. Render the silhouette by lod3 or lod4 or lod5 mesh***
			if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected)
			{
				node = magoManager.nodeSelected;
				
				if (node !== undefined) // test code.***
				{
					var geoLocDataManager = node.getNodeGeoLocDataManager();
					neoBuilding = magoManager.buildingSelected;
					var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				
					currentShader = magoManager.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
					currentShader.useProgram();

					gl.enableVertexAttribArray(currentShader.position3_loc);
					
					buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

					gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
					gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, magoManager.sceneState.modelViewRelToEyeMatrix._floatArrays);
					gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
					gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
					
					// do the colorCoding render.***
					
					gl.uniform4fv(currentShader.color4Aux_loc, [0.0, 1.0, 0.0, 1.0]);
					gl.uniform2fv(currentShader.screenSize_loc, [magoManager.sceneState.drawingBufferWidth, magoManager.sceneState.drawingBufferHeight]);
					gl.uniformMatrix4fv(currentShader.ProjectionMatrix_loc, false, magoManager.sceneState.projectionMatrix._floatArrays);
					
					gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
					
					gl.enable(gl.STENCIL_TEST);
					gl.disable(gl.POLYGON_OFFSET_FILL);
					gl.disable(gl.CULL_FACE);
					gl.disable(gl.DEPTH_TEST);
					gl.depthRange(0, 0);
					
					gl.stencilFunc(gl.EQUAL, 0, 1);
					gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
					//gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
						
					//glPrimitive = gl.POINTS;
					glPrimitive = gl.TRIANGLES;
					gl.uniform1i(currentShader.refMatrixType_loc, 0); // 0 = identity matrix, there are not referencesMatrix.***
					//gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );
					/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					
					
					var refTMatrixIdxKey = 0;
					var minSizeToRender = 0.0;
					var renderType = 0;
					var refMatrixIdxKey =0; // provisionally set magoManager var here.***
					var offsetSize = 4/1000;

					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
					magoManager.renderer.renderNodes(gl, [node], magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
					magoManager.renderer.renderNodes(gl, [node], magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
					magoManager.renderer.renderNodes(gl, [node], magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
					magoManager.renderer.renderNodes(gl, [node], magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
					
					currentShader.disableVertexAttribArrayAll();
				}
				/*
				var geoLocDataManager = node.getNodeGeoLocDataManager();
				neoBuilding = magoManager.buildingSelected;
				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				//var neoReferencesMotherAndIndices = magoManager.octreeSelected.neoReferencesMotherAndIndices;
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				var skinLego = neoBuilding.getCurrentSkin();
				if (skinLego !== undefined)
				{
					// do as the "getSelectedObjectPicking".**********************************************************
					currentShader = magoManager.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
					currentShader.useProgram();

					gl.enableVertexAttribArray(currentShader.position3_loc);
					
					buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

					gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
					gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, magoManager.sceneState.modelViewRelToEyeMatrix._floatArrays);
					gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
					gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
					
					// do the colorCoding render.***
					
					gl.uniform4fv(currentShader.color4Aux_loc, [0.0, 1.0, 0.0, 1.0]);
					gl.uniform2fv(currentShader.screenSize_loc, [magoManager.sceneState.drawingBufferWidth, magoManager.sceneState.drawingBufferHeight]);
					gl.uniformMatrix4fv(currentShader.ProjectionMatrix_loc, false, magoManager.sceneState.projectionMatrix._floatArrays);
					
					gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
					
					gl.enable(gl.STENCIL_TEST);
					gl.disable(gl.POLYGON_OFFSET_FILL);
					gl.disable(gl.CULL_FACE);
					gl.disable(gl.DEPTH_TEST);
					gl.depthRange(0, 0);
					
					gl.stencilFunc(gl.EQUAL, 0, 1);
					gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
					//gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
						
					//glPrimitive = gl.POINTS;
					glPrimitive = gl.TRIANGLES;
					gl.uniform1i(currentShader.refMatrixType_loc, 0); // 0 = identity matrix, there are not referencesMatrix.***
					//gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );

					var offsetSize = 4/1000;
					var localRenderType = 0; // only need positions.***
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
					skinLego.render(magoManager, localRenderType, renderTexture, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
					skinLego.render(magoManager, localRenderType, renderTexture, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
					skinLego.render(magoManager, localRenderType, renderTexture, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
					skinLego.render(magoManager, localRenderType, renderTexture, currentShader);
					gl.enable(gl.DEPTH_TEST);// return to the normal state.***
					gl.disable(gl.STENCIL_TEST);
					gl.depthRange(0, 1);// return to the normal value.***
					gl.disableVertexAttribArray(currentShader.position3_loc);
					
					currentShader.disableVertexAttribArrayAll();
				}
				*/
			}
			
			// draw the axis.***
			if (magoManager.magoPolicy.getShowOrigin())
			{
				node = magoManager.nodeSelected;
				//var geoLocDataManager = node.getNodeGeoLocDataManager();
				var nodes = [node];
				
				this.renderAxisNodes(nodes, renderType);
			}
		}
		
		
		// 3) now render bboxes.*******************************************************************************************************************
		var nodesPcloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesLOD0Count > 0 || nodesLOD2Count > 0 || nodesLOD3Count > 0 || nodesPcloudCount > 0)
		{
			if (magoManager.magoPolicy.getShowBoundingBox())
			{
				
				var bRenderLines = true;
				//var currentVisiblesArray = visibleObjControlerNodes.currentVisibles0.concat(visibleObjControlerNodes.currentVisibles2,);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisibles0, undefined, bRenderLines);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisibles2, undefined, bRenderLines);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisibles3, undefined, bRenderLines);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisiblesAux, undefined, bRenderLines);
			}
		}
		
		// 4) Render ObjectMarkers.********************************************************************************************************
		// 4) Render ObjectMarkers.********************************************************************************************************
		// 4) Render ObjectMarkers.********************************************************************************************************
		var objectsMarkersCount = magoManager.objMarkerManager.objectMarkerArray.length;
		if (objectsMarkersCount > 0)
		{
			// now repeat the objects markers for png images.***
			// Png for pin image 128x128.********************************************************************
			if (magoManager.pin.positionBuffer === undefined)
			{ magoManager.pin.createPinCenterBottom(gl); }
			
			currentShader = magoManager.postFxShadersManager.pngImageShader; // png image shader.***
			currentShader.resetLastBuffersBinded();
			
			shaderProgram = currentShader.program;
			
			gl.useProgram(shaderProgram);
			gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
			gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
			gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, magoManager.sceneState.modelViewRelToEyeMatrixInv._floatArrays);
			
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis); 
			// Tell the shader to get the texture from texture unit 0
			gl.uniform1i(currentShader.texture_loc, 0);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.activeTexture(gl.TEXTURE0);
			
			gl.depthRange(0, 0);
			//var context = document.getElementById('canvas2').getContext("2d");
			//var canvas = document.getElementById("magoContainer");
			
			gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.pin.positionBuffer);
			gl.vertexAttribPointer(currentShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.pin.texcoordBuffer);
			gl.vertexAttribPointer(currentShader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
			var j=0;
			for (var i=0; i<objectsMarkersCount; i++)
			{
				if (j>= magoManager.pin.texturesArray.length)
				{ j=0; }
				
				var currentTexture = magoManager.pin.texturesArray[j];
				var objMarker = magoManager.objMarkerManager.objectMarkerArray[i];
				var objMarkerGeoLocation = objMarker.geoLocationData;
				gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

				gl.drawArrays(gl.TRIANGLES, 0, 6);
				
				j++;
			}
			gl.depthRange(0, 1);
			gl.useProgram(null);
			gl.bindTexture(gl.TEXTURE_2D, null);
			currentShader.disableVertexAttribArrayAll();
			
		}
		
		// test renders.***
		// render cctv.***
		/*
		magoManager.test_cctv();
		var cctvsCount = 0;
		if (magoManager.cctvList !== undefined)
		{
			cctvsCount = magoManager.cctvList.getCCTVCount();
		}
		if (cctvsCount > 0)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			magoManager.cctvList.render(magoManager, currentShader );
		}
		*/
		
		// PointsCloud.****************************************************************************************
		// PointsCloud.****************************************************************************************
		var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			magoManager.sceneState.camera.setCurrentFrustum(0);
			var frustumIdx = magoManager.currentFrustumIdx;
			magoManager.sceneState.camera.frustum.near[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].near[0];
			magoManager.sceneState.camera.frustum.far[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].far[0];
			
			if (renderingSettings.getApplySsao())
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } 
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			else
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } // change this for "pointsCloud_rainbow" todo:
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloud"); } 
			}
			currentShader.useProgram();
			currentShader.resetLastBuffersBinded();
			currentShader.enableVertexAttribArray(currentShader.position3_loc);
			currentShader.enableVertexAttribArray(currentShader.color4_loc);
			currentShader.bindUniformGenerals();
			
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (magoManager.pointsCloudWhite !== undefined && magoManager.pointsCloudWhite)
			{
				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [0.99, 0.99, 0.99, 1.0]); //.***
			}
			else 
			{
				gl.uniform1i(currentShader.bUse1Color_loc, false);
			}
			var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
			gl.uniform1i(currentShader.bUseColorCodingByHeight_loc, true);
			gl.uniform1f(currentShader.minHeight_rainbow_loc, 40.0);
			gl.uniform1f(currentShader.maxHeight_rainbow_loc, 75.0);
			gl.uniform1f(currentShader.maxPointSize_loc, pCloudSettings.maxPointSize);
	
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			
			// Test to load pCloud.***
			if (magoManager.visibleObjControlerPCloudOctrees === undefined)
			{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			magoManager.visibleObjControlerPCloudOctrees.clear();
			magoManager.renderer.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShader, renderTexture, renderType); // lod0.***
			currentShader.disableVertexAttribArrayAll();
			
			gl.useProgram(null);

		}
		
		
		// Test TinTerrain.**************************************************************************
		// Test TinTerrain.**************************************************************************
		// render tiles, rendertiles.***
		
		if (magoManager.tinTerrainManager !== undefined)
		{
			var bDepthRender = false; // magoManager is no depth render.***
			magoManager.tinTerrainManager.render(magoManager, bDepthRender, renderType);
		}

	}

	
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);	
};


/**
 * This function renders the axis coordinates of the nodes.
 * @param {Array} nodesArray Nodes that render the axis.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 */
Renderer.prototype.renderAxisNodes = function(nodesArray, renderType) 
{
	var magoManager = this.magoManager;
	
	if (magoManager.axisXYZ.vbo_vicks_container.vboCacheKeysArray.length === 0)
	{ 
		var mesh = magoManager.axisXYZ.makeMesh(30); 
		mesh.getVboTrianglesConvex(magoManager.axisXYZ.vbo_vicks_container, magoManager.vboMemoryManager);
	}
	
	var gl = magoManager.getGl();
	var color;
	var node;
	var currentShader;
	if (renderType === 0)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		gl.disable(gl.BLEND);
	}
	if (renderType === 1)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		gl.enable(gl.BLEND);
	}
	
	var noiseTexture = magoManager.texturesManager.getNoiseTexture4x4();
	
	// Test rendering by modelRefShader.****
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.***
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	
	// -------------------------------------
	
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	var shaderProgram = currentShader.program;
	currentShader.bindUniformGenerals();
	gl.enableVertexAttribArray(currentShader.position3_loc);
		
	if (renderType === 1)
	{
		var textureAux1x1 = magoManager.texturesManager.getTextureAux1x1();
		
		// provisionally render all native projects.***
		gl.enableVertexAttribArray(currentShader.normal3_loc);
		gl.enableVertexAttribArray(currentShader.color4_loc);

		gl.uniform1i(currentShader.bUse1Color_loc, false);
		if (color)
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, 1.0]); //.***
		}
		else 
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.***
		}
		
		gl.uniform1i(currentShader.bUseNormal_loc, true);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	var neoBuilding;
	var natProject, mesh;
	var geoLocDataManager;
	var buildingGeoLocation;
	var nodesCount = nodesArray.length;
	for (var b=0; b<nodesCount; b++)
	{
		node = nodesArray[b];
		neoBuilding = node.data.neoBuilding;

		gl.uniform3fv(currentShader.scale_loc, [1, 1, 1]); //.***
		var buildingGeoLocation = node.getNodeGeoLocDataManager().getCurrentGeoLocationData();
		
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);
		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		
		magoManager.renderer.renderObject(gl, magoManager.axisXYZ, magoManager, currentShader, renderType);
	}
	

	currentShader.disableVertexAttribArrayAll();
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.disable(gl.BLEND);
};

/**
 * This function renders the bounding boxex of nodes included in nodesArray.
 * @param {Array} nodesArray Nodes that render the bbox.
 * @param {Color} color The color of the bounding box.
 * @param {Boolean} bRenderLines Parameter that indicates if render the edges of the bounding box.
 */
Renderer.prototype.renderBoundingBoxesNodes = function(nodesArray, color, bRenderLines) 
{
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	
	if (nodesArray === undefined || nodesArray.length === 0)
	{ return; }
	
	if (magoManager.unitaryBoxSC === undefined)
	{
		magoManager.unitaryBoxSC = new BoxAux();
		magoManager.unitaryBoxSC.makeAABB(1.0, 1.0, 1.0); // make a unitary box.***
		magoManager.unitaryBoxSC.vBOVertexIdxCacheKey = magoManager.unitaryBoxSC.triPolyhedron.getVBOArrayModePosNorCol(magoManager.unitaryBoxSC.vBOVertexIdxCacheKey, magoManager.vboMemoryManager);
	}
	
	var node;
	var currentShader = magoManager.postFxShadersManager.getTriPolyhedronShader(); // box ssao.***
	var shaderProgram = currentShader.program;
	gl.enable(gl.BLEND);
	gl.frontFace(gl.CCW);
	gl.useProgram(shaderProgram);
	currentShader.disableVertexAttribArrayAll();
	currentShader.disableTextureImagesUnitsAll();

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, magoManager.sceneState.modelViewMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, magoManager.sceneState.projectionMatrix._floatArrays);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);

	gl.uniform1f(currentShader.near_loc, magoManager.sceneState.camera.frustum.near);
	gl.uniform1f(currentShader.far_loc, magoManager.sceneState.camera.frustum.far);
	
	gl.uniform1i(currentShader.bApplySsao_loc, false);

	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, magoManager.sceneState.normalMatrix4._floatArrays);
	//-----------------------------------------------------------------------------------------------------------

	gl.uniform1i(currentShader.hasAditionalMov_loc, true);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform1i(currentShader.bScale_loc, true);
	var alfa = 1.0;
	gl.uniform1i(currentShader.bUse1Color_loc, true);
	if (color)
	{
		gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, alfa]); //.***
	}
	else 
	{
		gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.0, 1.0, alfa]); //.***
	}

	gl.uniform1i(currentShader.depthTex_loc, 0);
	gl.uniform1i(currentShader.noiseTex_loc, 1);
	gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
	gl.uniform1f(currentShader.fov_loc, magoManager.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
	gl.uniform1f(currentShader.aspectRatio_loc, magoManager.sceneState.camera.frustum.aspectRatio);
	gl.uniform1f(currentShader.screenWidth_loc, magoManager.sceneState.drawingBufferWidth);	
	gl.uniform1f(currentShader.screenHeight_loc, magoManager.sceneState.drawingBufferHeight);

	var noiseTexture = magoManager.texturesManager.getNoiseTexture4x4();
	gl.uniform2fv(currentShader.noiseScale2_loc, [magoManager.depthFboNeo.width/noiseTexture.width, magoManager.depthFboNeo.height/noiseTexture.height]);
	gl.uniform3fv(currentShader.kernel16_loc, magoManager.kernel);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
	
	

	var neoBuilding;
	var bbox;
	var ssao_idx = 1;
	var nodesCount = nodesArray.length;
	for (var b=0; b<nodesCount; b++)
	{
		currentShader.resetLastBuffersBinded();
		
		node = nodesArray[b];
		neoBuilding = node.data.neoBuilding;
		bbox = node.getBBox();

		gl.uniform3fv(currentShader.scale_loc, [bbox.getXLength(), bbox.getYLength(), bbox.getZLength()]); //.***
		var buildingGeoLocation = node.getNodeGeoLocDataManager().getCurrentGeoLocationData();
		
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

		magoManager.pointSC = bbox.getCenterPoint(magoManager.pointSC);
		gl.uniform3fv(currentShader.aditionalMov_loc, [magoManager.pointSC.x, magoManager.pointSC.y, magoManager.pointSC.z]); //.***
		//gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		this.renderObject(gl, magoManager.unitaryBoxSC, magoManager, currentShader, ssao_idx, bRenderLines);
	}

	currentShader.resetLastBuffersBinded();
	currentShader.disableVertexAttribArrayAll();
	currentShader.disableTextureImagesUnitsAll();
	
	gl.disable(gl.BLEND);
};

/**
 * This function renders a quad fitted to the screen.
 */
Renderer.prototype.renderFilter = function() 
{
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	
	if (magoManager.screenQuad === undefined)
	{
		var sceneState = magoManager.sceneState;
		var camera = magoManager.myCameraSCX;
		var frustum = camera.bigFrustum;
		
		var fovyRad = magoManager.sceneState.camera.frustum.fovyRad;
		var aspectRatio = frustum.aspectRatio[0];
		var halfHeight = frustum.tangentOfHalfFovy[0];
		var halfWidth = halfHeight * aspectRatio;
		
		var lb = new Point3D(-halfWidth, -halfHeight, -1.0); // leftBottom.***
		var rb = new Point3D(halfWidth, -halfHeight, -1.0); // rightBottom.***
		var ru = new Point3D(halfWidth, halfHeight, -1.0); // rightUp.***
		var lu = new Point3D(-halfWidth, halfHeight, -1.0); // leftUp.***
	
		var data = new Float32Array([lb.x, lb.y, lb.z,   rb.x, rb.y, rb.z,   lu.x, lu.y, lu.z,   
			rb.x, rb.y, rb.z,   ru.x, ru.y, ru.z,   lu.x, lu.y, lu.z]);
		magoManager.screenQuad = FBO.createBuffer(gl, data);
	}
	
	var shaderName = "filterSilhouette"; 
	var currentShader = magoManager.postFxShadersManager.getShader(shaderName); 
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao default.***
	
	var noiseTexture = magoManager.texturesManager.getNoiseTexture4x4();
	
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	
	currentShader.bindUniformGenerals();
	gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
	gl.activeTexture(gl.TEXTURE2); 
	//gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
	//currentShader.last_tex_id = magoManager.textureAux_1x1;
	
	// do render.***
	gl.bindBuffer(gl.ARRAY_BUFFER, magoManager.screenQuad);
	gl.vertexAttribPointer(currentShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	//gl.activeTexture(gl.TEXTURE2);
	//gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	
	currentShader.disableVertexAttribArrayAll();
	gl.useProgram(null);
};

/**
 * Renders the current frustumVolumen with colorCoding for selection.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 */
Renderer.prototype.renderGeometryColorCoding = function(visibleObjControlerNodes) 
{
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	var renderType = 2; // 0 = depthRender, 1= colorRender, 2 = selectionRender.***
	
	//if (magoManager.selectionFbo.dirty) // todo.
	{
		var refTMatrixIdxKey = 0;
		var renderTexture = false;

		var currentShader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
		currentShader.useProgram();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		
		currentShader.bindUniformGenerals();
		
		gl.disable(gl.CULL_FACE);
		// do the colorCoding render.***
		var minSizeToRender = 0.0;
		var renderType = 2;
		magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
		magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
		magoManager.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);

		gl.enable(gl.CULL_FACE);
		currentShader.disableVertexAttribArray(currentShader.position3_loc);
		gl.useProgram(null);
		
		// Render cuttingPlanes of temperaturalayers if exist.***
		if (magoManager.weatherStation)
		{ magoManager.weatherStation.test_renderCuttingPlanes(magoManager, renderType); }
	}
	
	if (magoManager.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS)
	{
		// render geographicCoords of the modeler.***
		if (magoManager.modeler !== undefined)
		{
			var shader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
			shader.useProgram();
			shader.enableVertexAttribArray(shader.position3_loc);
			shader.disableVertexAttribArray(shader.texCoord2_loc);
			shader.disableVertexAttribArray(shader.normal3_loc);
		
			shader.bindUniformGenerals();
			
			gl.disable(gl.CULL_FACE);
			magoManager.modeler.render(magoManager, shader, renderType);
		}
	}
	
	// tin terrain.***
	if (magoManager.tinTerrainManager !== undefined)
	{
		var bDepth = false;
		magoManager.tinTerrainManager.render(magoManager, bDepth, renderType);
		gl.useProgram(null);
	}
};


/**
 * Mago geometries generation test.***
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 */
Renderer.prototype.renderMagoGeometries = function(renderType) 
{
	var magoManager = this.magoManager;
	
	// 1rst, make the test object if no exist.***
	return;
	
	if (magoManager.nativeProjectsArray === undefined)
	{
		magoManager.nativeProjectsArray = [];
		var natProject = new MagoNativeProject();
		magoManager.nativeProjectsArray.push(natProject);
		
		var pMesh = natProject.newParametricMesh();
		
		pMesh.profile = new Profile2D(); // provisional.***
		var profileAux = pMesh.profile; // provisional.***
		
		profileAux.TEST__setFigureHole_2();
		//profileAux.TEST__setFigure_1();
		
		if (pMesh.vboKeyContainer === undefined)
		{ pMesh.vboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
		
		if (pMesh.vboKeyContainerEdges === undefined)
		{ pMesh.vboKeyContainerEdges = new VBOVertexIdxCacheKeysContainer(); }
		
		var bIncludeBottomCap, bIncludeTopCap;
		var extrusionVector, extrusionDist, extrudeSegmentsCount;
		/*
		extrudeSegmentsCount = 120;
		extrusionDist = 15.0;
		pMesh.extrude(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector);
		*/
		
		var revolveAngDeg, revolveSegmentsCount, revolveSegment2d;
		revolveAngDeg = 90.0;
		revolveSegment2d = new Segment2D();
		var strPoint2d = new Point2D(20, -10);
		var endPoint2d = new Point2D(20, 10);
		revolveSegment2d.setPoints(strPoint2d, endPoint2d);
		revolveSegmentsCount = 24;
		pMesh.revolve(profileAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d);
		
		bIncludeBottomCap = true;
		bIncludeTopCap = true;
		var mesh = pMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		mesh.setColor(0.1, 0.5, 0.5, 1.0);

		mesh.getVbo(pMesh.vboKeyContainer, magoManager.vboMemoryManager);
		mesh.getVboEdges(pMesh.vboKeyContainerEdges, magoManager.vboMemoryManager);
		
		// Now, provisionally make a geoLocationData for the nativeProject.*************************************
		if (natProject.geoLocDataManager === undefined)
		{
			natProject.geoLocDataManager = new GeoLocationDataManager();
			var geoLoc = natProject.geoLocDataManager.newGeoLocationData("deploymentLoc"); 
			
			var longitude = 126.61120237344926;
			var latitude = 37.577213509597016;
			var altitude = 50;
			var heading = 0.0;
			var pitch = 0.0;
			var roll = 0.0;

			ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, geoLoc, magoManager);
		}
		
	}
	//---------------------------------------------------------------------------------------------------------------
	var gl = magoManager.sceneState.gl;
	var color;
	var node;
	var currentShader;
	if (renderType === 0)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		gl.disable(gl.BLEND);
	}
	if (renderType === 1)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		gl.enable(gl.BLEND);
	}
	
	
	// Test rendering by modelRefShader.****
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.***
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true); // turn on/off specular lighting & normals.***
	
	// -------------------------------------
	
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	var shaderProgram = currentShader.program;
	currentShader.bindUniformGenerals();
	gl.enableVertexAttribArray(currentShader.position3_loc);
		
	if (renderType === 1)
	{
		var textureAux1x1 = magoManager.texturesManager.getTextureAux1x1();
		var noiseTexture = magoManager.texturesManager.getNoiseTexture4x4();
		
		// provisionally render all native projects.***
		gl.enableVertexAttribArray(currentShader.normal3_loc);
		gl.enableVertexAttribArray(currentShader.color4_loc);

		gl.uniform1i(currentShader.bUse1Color_loc, false);
		if (color)
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, 1.0]); //.***
		}
		else 
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.***
		}
		
		gl.uniform1i(currentShader.bUseNormal_loc, true);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	var neoBuilding;
	var natProject, pMesh;
	var geoLocDataManager;
	var buildingGeoLocation;
	var bRenderLines = false;
	var nativeProjectsCount = magoManager.nativeProjectsArray.length;
	for (var i=0; i<nativeProjectsCount; i++)
	{
		natProject = magoManager.nativeProjectsArray[i];
		geoLocDataManager = natProject.geoLocDataManager;
		
		gl.uniform3fv(currentShader.scale_loc, [1, 1, 1]); //.***
		buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		
		var meshesCount = natProject.getMeshesCount();
		for (var j=0; j<meshesCount; j++)
		{
			pMesh = natProject.getMesh(j);
			magoManager.renderer.renderObject(gl, pMesh, magoManager, currentShader, renderType, bRenderLines);
		}
	}
	
	if (currentShader)
	{
		if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
		if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
		if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
		if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
	}
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.disable(gl.BLEND);
	
};





