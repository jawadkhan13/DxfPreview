import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// Revert to default import only
import * as makerjs from 'makerjs'; // Revert to namespace import
console.log('Imported makerjs object:', makerjs); // Log the imported object
// Remove function existence logs for now

// Converts DXF entities into Maker.js path objects
export function parseDxfToMakerJs(dxf) {
  const paths = {};
  let pathId = 0;

  if (!dxf.entities) {
    console.warn('No entities found in DXF file');
    throw new Error('No entities found in DXF file');
  }

  console.log('Parsing DXF entities for Maker.js:', dxf.entities);

  dxf.entities.forEach((entity) => {
    console.log('Processing entity:', entity.type, entity);
    const layer = entity.layer || '0'; // Default layer if not specified

    try {
      switch (entity.type) {
        case 'LINE':
          if (entity.vertices && entity.vertices.length >= 2) {
            paths[`line_${pathId++}`] = new makerjs.paths.Line(
              [entity.vertices[0].x, entity.vertices[0].y],
              [entity.vertices[1].x, entity.vertices[1].y]
            );
          } else if (entity.start && entity.end) {
             paths[`line_${pathId++}`] = new makerjs.paths.Line(
              [entity.start.x, entity.start.y],
              [entity.end.x, entity.end.y]
            );
          }
          break;

        case 'ARC':
          if (entity.center && typeof entity.radius === 'number' && typeof entity.startAngle === 'number' && typeof entity.endAngle === 'number') {
            // Maker.js uses degrees
            paths[`arc_${pathId++}`] = new makerjs.paths.Arc(
              [entity.center.x, entity.center.y],
              entity.radius,
              entity.startAngle,
              entity.endAngle
            );
          }
          break;

        case 'CIRCLE':
          if (entity.center && typeof entity.radius === 'number') {
            paths[`circle_${pathId++}`] = new makerjs.paths.Circle(
              [entity.center.x, entity.center.y],
              entity.radius
            );
          }
          break;

        case 'LWPOLYLINE':
          if (entity.vertices && entity.vertices.length > 0) {
            for (let i = 0; i < entity.vertices.length; i++) {
              const startVertex = entity.vertices[i];
              const endVertex = entity.vertices[(i + 1) % entity.vertices.length]; // Wrap around for closed polylines

              // Check if we need to close the polyline
              if (!entity.shape && i === entity.vertices.length - 1) {
                break; // Don't connect last to first if not closed
              }

              const startPoint = [startVertex.x, startVertex.y];
              const endPoint = [endVertex.x, endVertex.y];

              if (startVertex.bulge) {
                // Use Maker.js's bulge function
                try {
                  const arc = makerjs.path.bulgeToArc(startPoint, endPoint, startVertex.bulge);
                  if (arc) {
                     paths[`poly_arc_${pathId++}`] = arc;
                  } else {
                     console.warn('Could not convert bulge to arc:', startPoint, endPoint, startVertex.bulge);
                     // Fallback to line if bulge conversion fails
                     paths[`poly_line_${pathId++}`] = new makerjs.paths.Line(startPoint, endPoint);
                  }
                } catch (bulgeError) {
                   console.error('Error converting bulge to arc:', bulgeError, startPoint, endPoint, startVertex.bulge);
                   // Fallback to line on error
                   paths[`poly_line_${pathId++}`] = new makerjs.paths.Line(startPoint, endPoint);
                }

              } else {
                // Straight segment
                paths[`poly_line_${pathId++}`] = new makerjs.paths.Line(startPoint, endPoint);
              }
            }
          }
          break;

        case 'SPLINE':
           if (entity.controlPoints && entity.controlPoints.length > 1) {
             // Approximate spline with line segments (same as before, but creating Maker.js lines)
             // TODO: Explore more accurate spline-to-bezier/arc conversion if needed
             const points = [];
             const numSegments = 30 * (entity.degree || 3); // More segments for higher degree splines

             for (let i = 0; i <= numSegments; i++) {
               const t = i / numSegments;
               // This assumes uniform knot vector, which might not be correct for all DXF splines
               const pt = makerjs.spline.getPoint(entity.degree || 3, entity.controlPoints.map(p => [p.x, p.y]), t);
               if (pt) {
                 points.push(pt);
               }
             }

             if (points.length > 1) {
                for (let i = 0; i < points.length - 1; i++) {
                   paths[`spline_line_${pathId++}`] = new makerjs.paths.Line(points[i], points[i + 1]);
                }
             } else {
                console.warn('Spline resulted in insufficient points for lines:', entity);
             }
           }
           break;

        case 'POLYLINE': // Add support for POLYLINE (adapting LWPOLYLINE logic)
          if (entity.vertices && entity.vertices.length > 0) {
            for (let i = 0; i < entity.vertices.length; i++) { // Corrected: <
              const startVertex = entity.vertices[i];
              // Use modulo for end vertex index - handles closed polylines automatically
              const endVertexIndex = (i + 1) % entity.vertices.length;
              const endVertex = entity.vertices[endVertexIndex];

              // Check if we should draw this segment:
              // - Always draw if not the last segment (i < length - 1)
              // - If it IS the last segment (i === length - 1), only draw if polyline is closed
              //   (Check entity.shape or flags - DXF group 70, bit 1 set means closed)
              const isClosed = entity.shape || (entity.flags & 1); // Corrected: &
              if (!isClosed && i === entity.vertices.length - 1) { // Corrected: &&
                break; // Don't connect last to first if polyline is open
              }

              const startPoint = [startVertex.x, startVertex.y];
              const endPoint = [endVertex.x, endVertex.y];

              // Handle bulge (assuming parser provides it on the vertex object)
              if (startVertex.bulge) {
                try {
                  const arc = makerjs.path.bulgeToArc(startPoint, endPoint, startVertex.bulge);
                  if (arc) {
                     paths[`poly_arc_${pathId++}`] = arc;
                  } else {
                     console.warn('POLYLINE: Could not convert bulge to arc:', startPoint, endPoint, startVertex.bulge);
                     paths[`poly_line_${pathId++}`] = new makerjs.paths.Line(startPoint, endPoint);
                  }
                } catch (bulgeError) {
                   console.error('POLYLINE: Error converting bulge to arc:', bulgeError, startPoint, endPoint, startVertex.bulge);
                   paths[`poly_line_${pathId++}`] = new makerjs.paths.Line(startPoint, endPoint);
                }
              } else {
                // Straight segment
                paths[`poly_line_${pathId++}`] = new makerjs.paths.Line(startPoint, endPoint);
              }

              // If it's a closed polyline and we just processed the last vertex connecting
              // back to the first, we are done.
              if (isClosed && i === entity.vertices.length - 1) { // Corrected: &&
                  break;
              }
            }
          }
          break;
        // Add cases for other entity types (ELLIPSE, etc.) if needed

        default:
          console.warn(`Unsupported entity type: ${entity.type}`);
      }
    } catch (error) {
      console.error(`Error processing entity type ${entity.type} (ID ${pathId}):`, entity, error);
      // Optionally skip this entity or handle the error differently
    }
  });

  console.log(`Parsed ${Object.keys(paths).length} paths for Maker.js model.`);
  return { paths }; // Return structure suitable for a Maker.js model
}

// Removed Bernstein/Binomial helpers as spline logic now uses makerjs.spline.getPoint

// Creates the THREE.js scene for previewing
// Note: This function still expects the *original* entity structure
// It needs to be adapted or bypassed if preview is driven by Maker.js model
export function createPreviewScene(makerjsModel, container) {
  console.log('Creating preview scene with Maker.js model:', makerjsModel);

  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Calculate bounding box and center from Maker.js model
  const extents = makerjs.measure.modelExtents(makerjsModel);
  if (!extents) {
    throw new Error('Cannot get model extents. Model might be empty or invalid.');
  }

  const size = {
    width: extents.high[0] - extents.low[0],
    height: extents.high[1] - extents.low[1],
  };
  const center = {
    x: extents.low[0] + size.width / 2,
    y: extents.low[1] + size.height / 2,
  };

  const maxDim = Math.max(size.width, size.height);
  const padding = maxDim * 0.1; // Add padding around the model

  if (maxDim === 0) {
     console.warn('Model dimensions are zero.');
     // Handle zero dimension case, maybe set a default size?
     // For now, we'll proceed but the camera might be weird.
  }

  console.log('Scene dimensions (Maker.js):', { size, center, maxDim });

  // Setup camera
  const camera = new THREE.OrthographicCamera(
    -maxDim/2 - padding,
    maxDim/2 + padding,
    maxDim/2 + padding,
    -maxDim/2 - padding,
    -1000,
    1000
  );
  camera.position.z = 100;
  // camera.lookAt(center); // Original - likely incorrect
  camera.lookAt(0, 0, 0); // Corrected: Look at scene origin where geometry is centered
  console.log('Camera position:', camera.position);
  console.log('Camera target:', new THREE.Vector3(0, 0, 0));


  // Setup renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientWidth);

  // Setup controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
  };

  // Convert Maker.js model to Three.js vertices
  const vertices = [];
  const accuracy = 0.1; // Controls arc/circle segmentation accuracy

  makerjs.model.walkPaths(makerjsModel, (modelContext, pathContext, p) => { // Use default import
      try {
          // console.log('Walking path:', pathContext, 'Path object:', p);
          let points = null;

          // Manual point extraction based on path type using default makerjs import
          switch (p.type) {
              case makerjs.pathType.Line:
                  points = [p.origin, p.end];
                  break;
              case makerjs.pathType.Circle: {
                  points = [];
                  const radius = p.radius;
                  const centerPt = p.origin;
                  // Calculate segments based on circumference for decent smoothness
                  const numSegments = Math.max(12, Math.ceil(radius * Math.PI / (accuracy * 5))); // Heuristic
                  for (let i = 0; i <= numSegments; i++) {
                      const angle = (i / numSegments) * 2 * Math.PI;
                      const x = centerPt[0] + radius * Math.cos(angle);
                      const y = centerPt[1] + radius * Math.sin(angle);
                      points.push([x, y]);
                  }
                  break;
              }
              case makerjs.pathType.Arc: {
                  points = [];
                  const radius = p.radius;
                  const centerPt = p.origin;
                  const startAngle = p.startAngle; // Assuming radians based on logs
                  const endAngle = p.endAngle; // Assuming radians
                  // Manual angle sweep calculation (handle wrap around)
                  let angleSweep = endAngle - startAngle;
                  if (angleSweep < 0) {
                      angleSweep += 2 * Math.PI; // Add full circle if end angle is smaller than start
                  }
                  // Ensure sweep is not larger than a full circle if angles are identical but represent a full circle arc
                  if (angleSweep === 0 && startAngle !== endAngle) { // Check if angles were identical in DXF
                      // This case might indicate a full circle defined as an arc, though unusual.
                      // DXF usually uses CIRCLE entity. If needed, handle based on DXF spec or specific file examples.
                      // For now, assume 0 sweep if start === end.
                      console.warn("Arc start and end angles are identical, resulting in zero sweep.", p);
                  }


                  // Calculate segments based on arc length for decent smoothness
                  const arcLength = Math.abs(radius * angleSweep);
                  const numSegments = Math.max(6, Math.ceil(arcLength / (accuracy * 5))); // Heuristic

                  for (let i = 0; i <= numSegments; i++) {
                      const angle = startAngle + (angleSweep * i / numSegments);
                      const x = centerPt[0] + radius * Math.cos(angle);
                      const y = centerPt[1] + radius * Math.sin(angle);
                      points.push([x, y]);
                  }
                  break;
              }
              default:
                  console.warn(`Unsupported path type for vertex generation: ${p.type}`);
          }

          // console.log('Points after manual calculation:', points); // Updated log message

          if (points && points.length > 1) { // Need at least 2 points for a line segment
              // console.log(`Generated ${points.length} points for path ${pathContext}`);
              // Create line segments from the points
              for (let i = 0; i < points.length - 1; i++) {
                  // Adjust points by the calculated center for THREE.js positioning
                  vertices.push(points[i][0] - center.x, points[i][1] - center.y, 0);
                  vertices.push(points[i + 1][0] - center.x, points[i + 1][1] - center.y, 0);
              }
              // Add closing segment for closed paths (like circles/arcs that form a full circle)
              // We rely on toPoints generating the points in order for curves
              if ((p.type === makerjs.pathType.Circle || (p.type === makerjs.pathType.Arc && Math.abs(p.endAngle - p.startAngle) >= 360)) && points.length > 1) {
                   console.log('Adding closing segment for path:', pathContext);
                   vertices.push(points[points.length - 1][0] - center.x, points[points.length - 1][1] - center.y, 0);
                   vertices.push(points[0][0] - center.x, points[0][1] - center.y, 0);
              }
          } else if (points && points.length === 1) {
              console.warn(`Only 1 point generated for path ${pathContext}, cannot create line segment.`);
          }
      } catch (walkError) {
          console.error('Error processing path during walk:', p, walkError);
      }
  });

  // console.log(`Generated ${vertices.length / 3} vertices for Three.js`);

  if (vertices.length === 0) {
      console.warn('No vertices generated from Maker.js model for Three.js rendering.');
      // Optionally handle this case, e.g., show a message
  } else {
      // Create geometry and material
      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const material = new THREE.LineBasicMaterial({
          color: 0x000000,
          linewidth: 1 // Note: linewidth > 1 requires LineMaterial from examples/jsm/lines
      });

      // Use LineSegments as toThreeJsPoints provides pairs of points for lines/arcs
      const lineSegments = new THREE.LineSegments(geometry, material);
      scene.add(lineSegments);
      console.log('Added LineSegments to scene:', lineSegments); // <-- ADD LOG
  }

  // Add grid helper
  const gridHelper = new THREE.GridHelper(maxDim + padding * 2, 20);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.material.opacity = 0.1;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  console.log('Preview scene created successfully. Final scene children:', scene.children); // <-- ADD LOG
  return { scene, camera, renderer };
}

// Calculates dimensions using a Maker.js model, converting to inches if necessary
export function calculateDimensionsFromMakerJsModel(makerjsModel, dxfUnits) { // Added dxfUnits parameter
  if (!makerjsModel || !makerjsModel.paths || Object.keys(makerjsModel.paths).length === 0) {
    console.warn('Cannot calculate dimensions: Empty or invalid Maker.js model provided.');
    return {
      width: 0,
      height: 0,
      area: 0,
      totalEdgeLength: 0,
      holeCount: 0,
    };
  }

  try {
    console.log('[DimCalc] Starting dimension calculation...');
    // Simplify the model
    console.log('[DimCalc] Simplifying Maker.js model...');
    const simplifiedModel = makerjs.model.simplify(makerjsModel, { pointMatchingTolerance: 0.001 });
    console.log('[DimCalc] Model simplified:', simplifiedModel);

    // Measure overall extents
    console.log('[DimCalc] Measuring model extents...');
    const simplifiedExtents = makerjs.measure.modelExtents(simplifiedModel);
    if (!simplifiedExtents) {
        console.error('[DimCalc] Failed to measure extents after simplification.');
        throw new Error('Failed to measure extents after simplification.');
    }
    console.log('[DimCalc] Measured extents:', simplifiedExtents);
    let width = simplifiedExtents.width;
    let height = simplifiedExtents.height;
    console.log('[DimCalc] Initial measured dimensions:', { width, height });

    // Heuristic conversion check
    const INCH_THRESHOLD = 20;
    const needsConversion = width > INCH_THRESHOLD || height > INCH_THRESHOLD;
    console.log(`[DimCalc] Needs conversion (width > ${INCH_THRESHOLD} || height > ${INCH_THRESHOLD})?`, needsConversion);

    if (needsConversion) {
      const conversionFactor = 1 / 25.4;
      width *= conversionFactor;
      height *= conversionFactor;
      console.log('[DimCalc] Converted dimensions (mm to inches):', { width, height });
    } else {
      console.log('[DimCalc] Dimensions assumed inches. No conversion applied.');
    }

    // Measure total path length
    console.log('[DimCalc] Measuring model path length...');
    let totalEdgeLength = makerjs.measure.modelPathLength(simplifiedModel);
    console.log('[DimCalc] Initial measured path length:', totalEdgeLength);

    // Convert edge length if dimensions were converted
    if (needsConversion) {
      totalEdgeLength *= (1 / 25.4);
      console.log('[DimCalc] Converted path length (mm to inches):', totalEdgeLength);
    }

    // Calculate area
    let totalArea = width * height; // Area in square inches
    console.log('[DimCalc] Calculated area (bounding box):', totalArea);

    // Hole detection (simplified)
    let holeCount = 0;
    console.log('[DimCalc] Detecting holes (simplified)...');
    for (const pathId in simplifiedModel.paths) {
      const path = simplifiedModel.paths[pathId];
      if (path.type === 'circle') {
        holeCount++;
      }
    }
    console.log(`[DimCalc] Detected ${holeCount} potential holes (circles).`);

    const finalDimensions = {
      width,
      height,
      area: Math.abs(totalArea),
      totalEdgeLength,
      holeCount,
    };
    console.log('[DimCalc] Final calculated dimensions:', finalDimensions);

    return finalDimensions;

  } catch (error) {
    // Log the specific error that occurred
    console.error('[DimCalc] Error during dimension calculation:', error.message, error.stack);
    // Return zero dimensions on error
    return {
      width: 0,
      height: 0,
      area: 0,
      totalEdgeLength: 0,
      holeCount: 0,
    };
  }
}
