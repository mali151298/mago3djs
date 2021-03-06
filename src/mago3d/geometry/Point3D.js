'use strict';

/**
 * a point feature which will be used at three degree world
 * @class Point3D 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 */

var Point3D = function(x, y, z) 
{
	if (!(this instanceof Point3D)) 
	{
		// throw new Error(Messages.CONSTRUCT_ERROR);
		throw new Error(i18next.t('error.construct.create'));
	}

	if (x !== undefined)
	{ this.x = x; }
	else
	{ this.x = 0.0; }
	
	if (y !== undefined)
	{ this.y = y; }
	else
	{ this.y = 0.0; }
	
	if (z !== undefined)
	{ this.z = z; }
	else
	{ this.z = 0.0; }
	
	this.pointType; // 1 = important point.
};

/**
 * delete the value of x,y,z coordi
 */
Point3D.prototype.deleteObjects = function() 
{
	this.x = undefined;
	this.y = undefined;
	this.z = undefined;
};

/**
 * copy the value of other point
 * @param {Point3D} point3d
 */
Point3D.prototype.copyFrom = function(point3d) 
{
	this.x = point3d.x;
	this.y = point3d.y;
	this.z = point3d.z;
};

/**
 * Calculate [this.x*this.x + this.y*this.y + this.z*this.z] to prepare squared module 
 * @returns {Number}
 */
Point3D.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y + this.z*this.z;
};

/**
 * Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
 * @returns {Number}
 */
Point3D.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

/**
 * 
 * get the unitary value
 */
Point3D.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

/**
 * 
 * check whether each value of the coordi is null or not
 * @returns {Boolean}
 */
Point3D.prototype.isNAN = function() 
{
	if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z) )
	{ return true; }
	else
	{ return false; }
};

/**
 * Calculate vector product
 * @param {Point3D} point the point which will be used at this calculate.
 * @param {Point3D} resultPoint the point which will save the calculated value.
 * @returns {Number} calculated result
 */
Point3D.prototype.crossProduct = function(point, resultPoint) 
{
	if (resultPoint === undefined) { resultPoint = new Point3D(); }

	resultPoint.x = this.y * point.z - point.y * this.z;
	resultPoint.y = point.x * this.z - this.x * point.z;
	resultPoint.z = this.x * point.y - point.x * this.y;

	return resultPoint;
};

/**
 * Calculate scalar production of vector
 * @param {Point3D} point the point which will be used at this calculate.
 * @returns {Number} calculated result
 */
Point3D.prototype.scalarProduct = function(point) 
{
	var scalarProd = this.x*point.x + this.y*point.y + this.z*point.z;
	return scalarProd;
};

/**
 * get the spherical coordinates
 * @param {GeographicCoord}resultGeographicCoords the target that will be canged
 * @returns {GeographicCoord} resultGeographicCoords
 */
Point3D.prototype.getSphericalCoords = function(resultGeographicCoords) 
{
	if (resultGeographicCoords === undefined)
	{ resultGeographicCoords = new GeographicCoord(); }
	
	// heading.
	var xyProjectedPoint = new Point2D(this.x, this.y);
	var longitudeVectorRef = new Point2D(1.0, 0.0);
	var headingDeg = xyProjectedPoint.angleDegToVector(longitudeVectorRef);
	
	if (this.y < 0.0)
	{
		headingDeg = 360.0 - headingDeg;
	}
	
	// azimutal.meridian angle
	var projectedModul = xyProjectedPoint.getModul();
	var azimutRad = Math.atan(this.z/projectedModul);
	var azimutDeg = azimutRad * 180.0 / Math.PI;
	
	if (this.z < 0.0)
	{
		azimutDeg *= -1.0;
	}
	
	resultGeographicCoords.longitude = headingDeg;
	resultGeographicCoords.latitude = azimutDeg;
	
	return resultGeographicCoords;
};

/**
 * Check whether those of two vectors are parallel or not
 * If parallel then check whether the direction sense is same or not 
 */
Point3D.prototype.getRelativeOrientationToVector = function(vector, radError) 
{
	var angRad = this.angleRadToVector(vector);
	if (angRad < radError)
	{ return 0; } // there are parallel & the same direction sense.
	else if (Math.abs(Math.PI - angRad) < radError)
	{ return 1; } // there are parallel & opposite direction sense.
	else
	{ return 2; } // there are NO parallels.
};

/**
 * Calculate the radian value of the angle of the two vectors
 * @param vector the target vector
 * @returns the angle of two vector
 */
Point3D.prototype.angleRadToVector = function(vector) 
{
	if (vector === undefined)
	{ return undefined; }
	
	//
	//var scalarProd = this.scalarProd(vector);
	var myModul = this.getModul();
	var vecModul = vector.getModul();
	
	// calculate by cos.
	//var cosAlfa = scalarProd / (myModul * vecModul); 
	//var angRad = Math.acos(cosAlfa);
	//var angDeg = alfa * 180.0/Math.PI;
	//------------------------------------------------------
	var error = 10E-10;
	if (myModul < error || vecModul < error)
	{ return undefined; }
	
	return Math.acos(this.scalarProduct(vector) / (myModul * vecModul));
};

/**
 * Calculate the degree value of the angle of the two vectors
 * @param point ??????
 * @param resultPoint ??????
 * @returns resultPoint
 */
Point3D.prototype.angleDegToVector = function(vector) 
{
	if (vector === undefined)
	{ return undefined; }
	
	var angRad = this.angleRadToVector(vector);
	
	if (angRad === undefined)
	{ return undefined; }
		
	return angRad * 180.0/Math.PI;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.squareDistToPoint = function(point) 
{
	var dx = this.x - point.x;
	var dy = this.y - point.y;
	var dz = this.z - point.z;

	return dx*dx + dy*dy + dz*dz;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @param py ??????
 * @param pz ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.isCoincidentToPoint = function(point, errorDist) 
{
	var squareDist = this.distToPoint(point);
	var coincident = false;
	if (squareDist < errorDist*errorDist)
	{
		coincident = true;
	}

	return coincident;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @param py ??????
 * @param pz ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.squareDistTo = function(x, y, z) 
{
	var dx = this.x - x;
	var dy = this.y - y;
	var dz = this.z - z;

	return dx*dx + dy*dy + dz*dz;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @param py ??????
 * @param pz ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.distTo = function(x, y, z) 
{
	return Math.sqrt(this.squareDistTo(x, y, z));
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @param py ??????
 * @param pz ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @param py ??????
 * @param pz ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.distToSphere = function(sphere) 
{
	return Math.sqrt(this.squareDistToPoint(sphere.centerPoint)) - sphere.r;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param px ??????
 * @param py ??????
 * @param pz ??????
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.aproxDistTo = function(pointB, sqrtTable) 
{
	var difX = Math.abs(this.x - pointB.x);
	var difY = Math.abs(this.y - pointB.y);
	var difZ = Math.abs(this.z - pointB.z);
	
	// find the big value.
	var maxValue, value1, value2;
	var value1Idx, value2Idx;
	
	if (difX > difY)
	{
		if (difX > difZ)
		{
			maxValue = difX;
			value1 = difY/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difZ/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
		else 
		{
			maxValue = difZ;
			value1 = difX/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difY/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
	}
	else 
	{
		if (difY > difZ)
		{
			maxValue = difY;
			value1 = difX/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difZ/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
		else 
		{
			maxValue = difZ;
			value1 = difX/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difY/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
	}
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param x ??????
 * @param y ??????
 * @param z ??????
 */
Point3D.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	// this returns a vector that points to "targetPoint" from "this".
	// the "resultVector" has the direction from "this" to "targetPoint", but is NOT normalized.
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (resultVector === undefined)
	{ resultVector = new Point3D(); }
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y, targetPoint.z - this.z);
	
	return resultVector;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param x ??????
 * @param y ??????
 * @param z ??????
 */
Point3D.prototype.set = function(x, y, z) 
{
	this.x = x; this.y = y; this.z = z;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param x ??????
 * @param y ??????
 * @param z ??????
 */
Point3D.prototype.add = function(x, y, z) 
{
	this.x += x; this.y += y; this.z += z;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param x ??????
 * @param y ??????
 * @param z ??????
 */
Point3D.prototype.addPoint = function(point) 
{
	this.x += point.x; this.y += point.y; this.z += point.z;
};

/**
 * ?????? ?????? ?????? ?????????????
 * @param x ??????
 * @param y ??????
 * @param z ??????
 */
Point3D.prototype.scale = function(scaleFactor) 
{
	this.x *= scaleFactor; this.y *= scaleFactor; this.z *= scaleFactor;
};


/**
 * 3?????? ??????
 * @class Point3DList
 */
var Point3DList = function() 
{
	if (!(this instanceof Point3DList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.points3dArray;
};

/**
 * ?????? ?????? ?????? ?????????????
 */
Point3DList.prototype.newPoint3D = function(x, y, z) 
{
	if (this.points3dArray === undefined)
	{ this.points3dArray = []; }
	
	var point3d = new Point3D(x, y, z);
	this.points3dArray.push(point3d);
	return point3d;
};

/**
 * ?????? ?????? ?????? ?????????????
 */
Point3DList.prototype.addPoint3D = function(point3d) 
{
	if (this.points3dArray === undefined)
	{ this.points3dArray = []; }
	
	this.points3dArray.push(point3d);
};

/**
 * ?????? ?????? ?????? ?????????????
 */
Point3DList.calculateBBox = function(points3DArray, resultBBox) 
{
	if (points3DArray === undefined)
	{ return undefined; }

	var pointCount = points3DArray.length;
	if (pointCount === 0)
	{ return undefined; }
	
	if (resultBBox === undefined)
	{ resultBBox = new BoundingBox(); }
	
	resultBBox.init(points3DArray[0]); // init the box.
	for (var i=1; i<pointCount; i++)
	{
		resultBBox.addPoint(points3DArray[i]);
	}
	
	return resultBBox;
};






























