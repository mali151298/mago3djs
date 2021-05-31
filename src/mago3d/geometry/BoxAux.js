'use strict';

/**
 * This is similar with the 3D version of the Bounding Rectangle but this is slighthly different.
 * 꼭지점을 가지고 한붓 그리기로 3차원 버전의 BB를 그립니다.
 * @class BoxAux
 */
var BoxAux = function() 
{
	if (!(this instanceof BoxAux)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// vertex indices of the BoxAux.
	//    3----------2        7----------6      
	//    |          |        |          |
	//    |  bottom  |        |   top    |
	//    |          |        |          |
	//    0----------1        4----------5
	
	this.triPolyhedron = new TriPolyhedron();
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.vBOVertexIdxCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
};

/**
 * get the Vbo keys container of this feature
 */
BoxAux.prototype.getVboKeysContainer = function()
{
	return this.vbo_vicks_container;
};

/**
 * make Axis Aligned Bounding Box(Aux)
 * @param {Number} xLength 
 * @param {Number} yLength
 * @param {Number} zLength
 */
BoxAux.prototype.makeAABB = function(xLength, yLength, zLength)
{
	// this makes a BoxAux centered on the center of the BoxAux.
	var minX = -xLength/2.0;
	var minY = -yLength/2.0;
	var minZ = -zLength/2.0;
	
	var maxX = xLength/2.0;
	var maxY = yLength/2.0;
	var maxZ = zLength/2.0;
	
	// make 8 vertices and 6 triSurfaces.
	var vertexList = this.triPolyhedron.vertexList;
	
	// Bottom.*
	var vertex = vertexList.newVertex(); // 0.
	vertex.setPosition(minX, minY, minZ);
	
	vertex = vertexList.newVertex(); // 1.
	vertex.setPosition(maxX, minY, minZ);
	
	vertex = vertexList.newVertex(); // 2.
	vertex.setPosition(maxX, maxY, minZ);
	
	vertex = vertexList.newVertex(); // 3.
	vertex.setPosition(minX, maxY, minZ);
	
	// Top.
	vertex = vertexList.newVertex(); // 4.
	vertex.setPosition(minX, minY, maxZ);
	
	vertex = vertexList.newVertex(); // 5.
	vertex.setPosition(maxX, minY, maxZ);
	
	vertex = vertexList.newVertex(); // 6.
	vertex.setPosition(maxX, maxY, maxZ);
	
	vertex = vertexList.newVertex(); // 7.
	vertex.setPosition(minX, maxY, maxZ);
	
	
	// now, create triSurfaces and triangles.
	var triSurface;
	var triangle;
	// Bottom surface.
	triSurface = this.triPolyhedron.newTriSurface();
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(0), vertexList.getVertex(2), vertexList.getVertex(1));
	
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(0), vertexList.getVertex(3), vertexList.getVertex(2));
	
	// Top surface.
	triSurface = this.triPolyhedron.newTriSurface();
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(4), vertexList.getVertex(5), vertexList.getVertex(6));
	
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(4), vertexList.getVertex(6), vertexList.getVertex(7));
	
	// Front surface.
	triSurface = this.triPolyhedron.newTriSurface();
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(0), vertexList.getVertex(1), vertexList.getVertex(5));
	
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(0), vertexList.getVertex(5), vertexList.getVertex(4));
	
	// Right surface.
	triSurface = this.triPolyhedron.newTriSurface();
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(1), vertexList.getVertex(2), vertexList.getVertex(6));
	
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(1), vertexList.getVertex(6), vertexList.getVertex(5));
	
	// Rear surface.
	triSurface = this.triPolyhedron.newTriSurface();
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(2), vertexList.getVertex(3), vertexList.getVertex(7));
	
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(2), vertexList.getVertex(7), vertexList.getVertex(6));
	
	// Left surface.
	triSurface = this.triPolyhedron.newTriSurface();
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(3), vertexList.getVertex(0), vertexList.getVertex(4));
	
	triangle = triSurface.newTriangle();
	triangle.setVertices(vertexList.getVertex(3), vertexList.getVertex(4), vertexList.getVertex(7));
	
};