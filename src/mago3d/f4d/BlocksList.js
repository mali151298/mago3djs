'use strict';

/**
 * 블록 리스트 객체
 * - 이 클래스는 Octree 클래스의 prepareModelReferencesListData 호출 통해 생성된다
 * 
 * @class BlocksList
 * 
 * @param {String} version
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @see Octree#prepareModelReferencesListData
 */
var BlocksList = function(version) 
{
	if (!(this instanceof BlocksList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * 블록 리스트 명
	 * @type {String}
	 * @default ''
	 */
	this.name = "";

	/**
	 * f4d 버전
	 * @type {String}
	 */
	this.version = version || "";

	/**
	 * 블락 리스트
	 * @type {Block[]}
	 */
	this.blocksArray;

	/**
	 *  block file load state. Default is 0(READY)
	 * "READY"            : 0,
	 * "LOADING_STARTED"  : 1,
	 * "LOADING_FINISHED" : 2,
	 * "PARSE_STARTED"    : 3,
	 * "PARSE_FINISHED"   : 4,
	 * "IN_QUEUE"         : 5,
	 * "LOAD_FAILED"      : 6
	 * @type {Number}
	 * 
	 * @see CODE#fileLoadState
	 */
	this.fileLoadState = CODE.fileLoadState.READY;

	/**
	 * block data array buffer.
	 * file loaded data, that is no parsed yet.
	 * @type {ArrayBuffer}
	 */
	this.dataArraybuffer;

	/**
	 * file request.
	 */
	this.xhr;
	
	/**
	 * BlocksArrayPartition 리스트 관련 변수들.
	 * f4d 버전 0.0.2 이후 부터 사용 계획있음 현재는 개발중
	 */
	this.blocksArrayPartitionsCount;
	this.blocksArrayPartitionsArray;
	this.blocksArrayPartitionsMasterPathName;
};

/**
 * 새 블록 생성 후 blocksArray에 푸쉬 및 반환
 * 
 * @returns {Block}
 */
BlocksList.prototype.newBlock = function() 
{
	if (this.blocksArray === undefined) { this.blocksArray = []; }

	var block = new Block();
	this.blocksArray.push(block);
	return block;
};

/**
 * 인덱스에 해당하는 블록 획득
 * @param {Number} idx
 * @returns {Block|null}
 */
BlocksList.prototype.getBlock = function(idx) 
{
	if (this.blocksArray === undefined) { return null; }

	if (idx >= 0 && idx < this.blocksArray.length) 
	{
		return this.blocksArray[idx];
	}
	return null;
};

/**
 * 블록 리스트 초기화. gl에서 해당 블록 리스트의 블록 및 lego 삭제
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {VboManager} vboMemManager 
 */
BlocksList.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	if (this.xhr !== undefined)
	{
		this.xhr.abort();
		this.xhr = undefined;
	}
	
	if (this.blocksArray === undefined) { return; }

	for (var i = 0, blocksCount = this.blocksArray.length; i < blocksCount; i++ ) 
	{
		var block = this.blocksArray[i];
		block.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
		block.vBOVertexIdxCacheKeysContainer = undefined; // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".
		block.mIFCEntityType = undefined;
		block.isSmallObj = undefined;
		block.radius = undefined;
		block.vertexCount = undefined; // only for test. delete this.
		if (block.lego) 
		{
			block.lego.vbo_vicks_container.deleteGlObjects(gl, vboMemManager);
			block.lego.vbo_vicks_container = undefined;
		}
		block.lego = undefined; // legoBlock.
		this.blocksArray[i] = undefined;
	}
	this.blocksArray = undefined;
	this.name = undefined;
	this.fileLoadState = undefined;
	this.dataArraybuffer = undefined; // file loaded data, that is no parsed yet.
};

/**
 * 사용하지 않는 부분들 계산하기 위한 파싱과정. stepOver
 * 파싱을 위한 파싱..
 * 블록리스트 버퍼를 파싱(비대칭적)하는 과정.
 * F4D 버전이 0.0.1일 경우 사용
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {Number} bytesReaded readed bytes.
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 */
BlocksList.prototype.stepOverBlockVersioned = function(arrayBuffer, bytesReaded, readWriter) 
{
	var vertexCount;
	var verticesFloatValuesCount;
	var normalByteValuesCount;
	var shortIndicesValuesCount;
	var sizeLevels;
	var startBuff, endBuff;
	
	// Spec document Table 3-1
	// vboCount
	var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	for ( var j = 0; j < vboDatasCount; j++ ) 
	{
		// 1) Positions array.
		// Spec document Table 3-2
		// vertexCount
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		verticesFloatValuesCount = vertexCount * 3;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 4 * verticesFloatValuesCount;
		bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.

		// 2) Normals.
		// Spec document Table 3-2
		// normalCount
		vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		normalByteValuesCount = vertexCount * 3;
		bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.

		// 3) Indices.
		// Spec document Table 3-2
		// indexCount
		shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);bytesReaded += 4;
		sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);bytesReaded += 1;
		bytesReaded = bytesReaded + sizeLevels * 4;
		bytesReaded = bytesReaded + sizeLevels * 4;
		bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.
	}
	
	return bytesReaded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * vboData 파싱 부분
 * Spec document Table 3-1
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {Number} bytesReaded 지금까지 읽은 바이트 길이
 * @param {Block} block 정보를 담을 block.
 * @param {ReaderWriter} readWriter
 * @param {MagoManager} magoManager
 * 
 * @see VBOVertexIdxCacheKey#readPosNorIdx
 */
BlocksList.prototype.parseBlockVersioned = function(arrayBuffer, bytesReaded, block, readWriter, magoManager) 
{
	var vboMemManager = magoManager.vboMemoryManager;
	var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	for ( var j = 0; j < vboDatasCount; j++ ) 
	{
		var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
		bytesReaded = vboViCacheKey.readPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded);
		block.vertexCount = vboViCacheKey.vertexCount;
	}
	
	return bytesReaded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * F4D 버전이 0.0.1일 경우 사용
 * This function parses the geometry data from binary arrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array.<Block>} motherBlocksArray Global blocks array.
 * @param {MagoManager} magoManager
 */
BlocksList.prototype.parseBlocksListVersioned_v001 = function(arrayBuffer, readWriter, motherBlocksArray, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var succesfullyGpuDataBinded = true;
	
	// read the version.
	var versionLength = 5;
	bytesReaded += versionLength;
	
	
	// modelCount
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	for ( var i = 0; i< blocksCount; i++ ) 
	{
		// modelIndex
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		// Check if block exist.
		if (motherBlocksArray[blockIdx]) 
		{
			// The block exists, then read data but no create a new block.
			bytesReaded += 4 * 6; // boundingBox.
			// step over vbo datas of the model.
			bytesReaded = this.stepOverBlockVersioned(arrayBuffer, bytesReaded, readWriter) ;
			
			// read lego if exist. (note: lego is exactly same of a model, is a mesh).
			var existLego = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
			if (existLego)
			{
				bytesReaded = this.stepOverBlockVersioned(arrayBuffer, bytesReaded, readWriter) ;
			}
			
			continue;
		}
		
		// The block doesn't exist, so creates a new block and read data.
		var block = new Block();
		block.idx = blockIdx;
		motherBlocksArray[blockIdx] = block;

		// 1rst, read bbox.
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		bbox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		var maxLength = bbox.getMaxLength();
		if (maxLength < 0.5) { block.isSmallObj = true; }
		else { block.isSmallObj = false; }

		block.radius = maxLength/2.0;

		bytesReaded = this.parseBlockVersioned(arrayBuffer, bytesReaded, block, readWriter, magoManager) ;
		
		// parse lego if exist.
		var existLego = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (existLego)
		{
			if (block.lego === undefined)
			{ 
				// TODO : this is no used. delete this.
				block.lego = new Lego(); 
			}
			bytesReaded = this.parseBlockVersioned(arrayBuffer, bytesReaded, block.lego, readWriter, magoManager) ;
		}
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return succesfullyGpuDataBinded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * F4D 버전이 0.0.2일 경우 사용
 * 매개변수로 arrayBuffer 전달받지 않고 blocksArrayPartition에 있는 arrayBuffer를 이용.
 * 
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array.<Block>} motherBlocksArray Global blocks array.
 * @param {MagoManager} magoManager
 */
BlocksList.prototype.parseBlocksListVersioned_v002 = function(readWriter, motherBlocksArray, magoManager) 
{
	// 1rst, find the blocksArrayPartition to parse.
	var blocksArrayPartitionsCount = this.blocksArrayPartitionsArray.length;
	var blocksArrayPartition = this.blocksArrayPartitionsArray[blocksArrayPartitionsCount-1];
	if (blocksArrayPartition.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{ return; }
	
	var arrayBuffer = blocksArrayPartition.dataArraybuffer;
	blocksArrayPartition.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var vboMemManager = magoManager.vboMemoryManager;
	var succesfullyGpuDataBinded = true;
	
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	for ( var i = 0; i< blocksCount; i++ ) 
	{
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var block;
		
		// Check if block exist.
		if (motherBlocksArray[blockIdx]) 
		{
			block = motherBlocksArray[blockIdx];
		}
		else 
		{
			// The block doesn't exist, so creates a new block and read data.
			block = new Block();
			block.idx = blockIdx;
			motherBlocksArray[blockIdx] = block;
		}
		
		// Now, read the blocks vbo's idx.
		var vboIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		if (vboIdx === 0)
		{
			// Only if the vboIdx = 0 -> read the bbox.
			var bbox = new BoundingBox();
			bbox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
			bbox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
			bbox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

			bbox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
			bbox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
			bbox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

			var maxLength = bbox.getMaxLength();
			if (maxLength < 0.5) { block.isSmallObj = true; }
			else { block.isSmallObj = false; }

			block.radius = maxLength/2.0;
		}
		
		// check if the vbo exists.
		var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[vboIdx];
		if (vboViCacheKey === undefined)
		{
			// Now, read the vbo (Pos-Nor-Idx).
			vboViCacheKey = new VBOVertexIdxCacheKey();
			block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[vboIdx] = vboViCacheKey;
			bytesReaded = vboViCacheKey.readPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded);
			block.vertexCount = vboViCacheKey.vertexCount;
		}
		else 
		{
			// step over.
			if (blocksCount > 1)
			{ bytesReaded = vboViCacheKey.stepOverPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded); }
		}
	}
	blocksArrayPartition.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED; // test.
	return succesfullyGpuDataBinded;
};

/**
 * 블록리스트 버퍼를 파싱(비대칭적)
 * This function parses the geometry data from binary arrayBuffer.
 * @deprecated f4d 0.0.1 이전 버전에서 사용
 * 
 * @param {ArrayBuffer} arrayBuffer Binary data to parse.
 * @param {ReaderWriter} readWriter Helper to read inside of the arrayBuffer.
 * @param {Array.<Block>} motherBlocksArray Global blocks array.
 */
BlocksList.prototype.parseBlocksList = function(arrayBuffer, readWriter, motherBlocksArray, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytesReaded = 0;
	var blocksCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
	
	var vboMemManager = magoManager.vboMemoryManager;
	var succesfullyGpuDataBinded = true;

	for ( var i = 0; i< blocksCount; i++ ) 
	{
		var blockIdx = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
		// Check if block exist.
		if (motherBlocksArray[blockIdx]) 
		{
			// The block exists, then read data but no create a new block.
			bytesReaded += 4 * 6; // boundingBox.
			// Read vbo datas (indices cannot superate 65535 value).
			var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			
			for ( var j = 0; j < vboDatasCount; j++ ) 
			{
				// 1) Positions array.
				var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var verticesFloatValuesCount = vertexCount * 3;
				startBuff = bytesReaded;
				endBuff = bytesReaded + 4 * verticesFloatValuesCount;
				bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.

				// 2) Normals.
				vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var normalByteValuesCount = vertexCount * 3;
				bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.

				// 3) Indices.
				var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
				
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + sizeLevels * 4;
				bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.
			}
			// Pendent to load the block's lego.
			continue;
		}
		
		// The block doesn't exist, so creates a new block and read data.
		var block = new Block();
		block.idx = blockIdx;
		motherBlocksArray[blockIdx] = block;
		
		// 1rst, read bbox.
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.minY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.minZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;

		bbox.maxX = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.maxY = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;
		bbox.maxZ = new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4));
		bytesReaded += 4;

		var maxLength = bbox.getMaxLength();
		if (maxLength < 0.5) { block.isSmallObj = true; }
		else { block.isSmallObj = false; }

		block.radius = maxLength/2.0;

		bbox.deleteObjects();
		bbox = undefined;

		// New for read multiple vbo datas (indices cannot superate 65535 value).
		var vboDatasCount = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4);
		bytesReaded += 4;
		for ( var j = 0; j < vboDatasCount; j++ ) 
		{
			var vboViCacheKey = block.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
			bytesReaded = vboViCacheKey.readPosNorIdx(arrayBuffer, readWriter, vboMemManager, bytesReaded);
			block.vertexCount = vboViCacheKey.vertexCount;
		}
		// Pendent to load the block's lego.
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return succesfullyGpuDataBinded;
};

/**
 * 블록리스트의 blocksArrayPartition정보를 할당 및 체크.
 * F4D 버전이 0.0.2일 경우 사용
 * 
 * @param {MagoManager} magoManager
 * @param {MagoManager} octreeOwner
 */
BlocksList.prototype.prepareData = function(magoManager, octreeOwner) 
{
	if (this.version === "0.0.1")
	{
		// Provisionally this function is into octree.prepareModelReferencesListData(...).
	}
	else if (this.version === "0.0.2")
	{
		// Check the current loading state.
		if (this.blocksArrayPartitionsArray === undefined)
		{ this.blocksArrayPartitionsArray = []; }
		
		var currPartitionsCount = this.blocksArrayPartitionsArray.length;
		if (currPartitionsCount === 0)
		{
			// Proceed to load the 1rst partition.
			var partitionIdx = 0;
			var filePathInServer = this.blocksArrayPartitionsMasterPathName + partitionIdx.toString();
			var blocksArrayPartition = new BlocksArrayPartition();
			this.blocksArrayPartitionsArray.push(blocksArrayPartition);
			magoManager.readerWriter.getNeoBlocksArraybuffer_partition(filePathInServer, octreeOwner, blocksArrayPartition, magoManager);
		}
		else
		{
			// Check the last partition.
			var lastBlocksArrayPartition = this.blocksArrayPartitionsArray[currPartitionsCount-1];
			if (lastBlocksArrayPartition.fileLoadState === CODE.fileLoadState.PARSE_FINISHED)
			{
				if (currPartitionsCount < this.blocksArrayPartitionsCount)
				{
					// Proceed to load another partition.
					var partitionIdx = currPartitionsCount;
					var filePathInServer = this.blocksArrayPartitionsMasterPathName + partitionIdx.toString();
					var blocksArrayPartition = new BlocksArrayPartition();
					this.blocksArrayPartitionsArray.push(blocksArrayPartition);
					magoManager.readerWriter.getNeoBlocksArraybuffer_partition(filePathInServer, octreeOwner, blocksArrayPartition, magoManager);
				}
			}
		}
	
	}
};