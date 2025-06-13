import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { Engine, Scene, useScene } from 'react-babylonjs';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'; // Import SceneLoader
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'; // For hemispheric light
import '@babylonjs/core/Meshes/Builders/groundBuilder'; // For CreateGround
import '@babylonjs/core/Meshes/Builders/boxBuilder'; // For CreateBox
import '@babylonjs/core/Meshes/Builders/sphereBuilder'; // For CreateSphere
// Ensure loaders are imported if you face issues with GLB loading, e.g.:
import "@babylonjs/loaders/glTF"; // For GLTF/GLB

// boardSpacePositions is defined globally in the file, so GameBoard can access it.
// It's also exported for App.jsx
const GameBoard = (props) => { // Accept props
  const scene = useScene();
  const { playerSpaceIndices } = props; // Destructure from props
  const [loadedAnimalModels, setLoadedAnimalModels] = useState([]);
  const [playerMeshes, setPlayerMeshes] = useState([]); // State for instantiated player meshes

  // Setup ground
  const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  ground.receiveShadows = true;

  // Setup boxes from boardSpacePositions (using module-level constant)
  boardSpacePositions.forEach((position, index) => {
    const box = MeshBuilder.CreateBox(`box-${index}`, { size: 1 }, scene);
    box.position = position;
    // You can add material or color to the boxes here if needed
  });

  // Constants for player model placement - these might need adjustment
  const playerModelYOffset = 0.5; // Assuming models' origin is at their base. Adjust if not.
  const playerModelScale = 0.02; // Generic scale factor, adjust as needed.
  const playerModelInterOffset = 0.3; // Offset for multiple players on the same tile.

  // Define player initial XZ offsets on a tile (similar to sphereOffsets before)
  const playerTileOffsets = [
    new Vector3(-playerModelInterOffset, 0, -playerModelInterOffset),
    new Vector3(playerModelInterOffset, 0, -playerModelInterOffset),
    new Vector3(-playerModelInterOffset, 0, playerModelInterOffset),
    new Vector3(playerModelInterOffset, 0, playerModelInterOffset),
  ];

  // Effect for cloning models and setting up players
  useEffect(() => {
    if (scene && loadedAnimalModels.length > 0 && playerMeshes.length === 0) {
      console.log("Creating player clones from loadedAnimalModels:", loadedAnimalModels.map(m=>m.name));
      const tempPlayerMeshes = []; // Use a temporary array before setting state
      const initialBoardSpacePos = boardSpacePositions[0]; // Still needed for eventual correct positioning

      for (let i = 0; i < Math.min(loadedAnimalModels.length, 4); i++) {
        const originalModel = loadedAnimalModels[i];
        if (originalModel) {
          console.log(`Original model ${originalModel.name} - enabled: ${originalModel.isEnabled()}, visible: ${originalModel.isVisible}`);
          originalModel.setEnabled(true); // Temporary Test: Enable original model

          const existingPlayerMesh = scene.getMeshByName("player" + i);
          if (existingPlayerMesh) {
            existingPlayerMesh.dispose();
          }

          const playerClone = originalModel.clone("player" + i, null, true);
          if (playerClone) {
            console.log("Attempting to make visible and position clone:", playerClone.name);

            // Temporary Debugging for Visibility:
            playerClone.position = new Vector3(i * 2, 1, 0);
            playerClone.scaling = new Vector3(5, 5, 5);

            playerClone.setEnabled(true);
            if (playerClone.getChildMeshes) {
              playerClone.getChildMeshes().forEach(child => child.setEnabled(true));
            }

            // Enable all parents of the clone
            let parent = playerClone.parent;
            while (parent) {
                if (parent.setEnabled) {
                    parent.setEnabled(true);
                    console.log(`Ensured parent ${parent.name} of ${playerClone.name} is enabled.`);
                }
                parent = parent.parent;
            }

            console.log(`Clone ${playerClone.name} - enabled: ${playerClone.isEnabled()}, visible: ${playerClone.isVisible}, isActuallyVisible: ${playerClone.isActuallyVisible}, parent: ${playerClone.parent?.name}, parent enabled: ${playerClone.parent?.isEnabled ? playerClone.parent.isEnabled() : 'N/A'}`);

            tempPlayerMeshes.push(playerClone);
          } else {
            console.warn(`Failed to clone model for player ${i}: ${originalModel.name}`);
          }
        }
      }
      setPlayerMeshes(tempPlayerMeshes);
    }
  }, [scene, loadedAnimalModels]);

  // Effect for updating player model positions based on playerSpaceIndices prop
  useEffect(() => {
    console.log("Current playerMeshes for movement:", playerMeshes.map(m=>m.name));
    if (scene && playerMeshes.length > 0 && playerSpaceIndices) {
      playerSpaceIndices.forEach((spaceIdx, playerIdx) => {
        if (playerIdx < playerMeshes.length) {
          const playerMeshInstance = playerMeshes[playerIdx];
          const targetBoardSpacePosition = boardSpacePositions[spaceIdx];

          if (playerMeshInstance && targetBoardSpacePosition) {
            const offset = playerTileOffsets[playerIdx] || Vector3.Zero(); // Get the same offset
            playerMeshInstance.position = new Vector3(
              targetBoardSpacePosition.x + offset.x,
              targetBoardSpacePosition.y + playerModelYOffset,
              targetBoardSpacePosition.z + offset.z
            );
          }
        }
      });
    }
  }, [playerSpaceIndices, scene, playerMeshes]); // Runs when playerSpaceIndices, scene, or playerMeshes change

  // Setup Dice
  const die = MeshBuilder.CreateBox("dice", { size: 0.5 }, scene);
  die.position = new Vector3(0, 1.25, -2); // Position it next to the board

  // Load animal models
  useEffect(() => {
    if (scene) {
      console.log("Attempting to load animal models...");
      SceneLoader.ImportMeshAsync(null, "/", "quirky_series_-_free_animals_pack.glb", scene)
        .then((result) => {
          console.log("Raw loaded meshes result:", result); // Log entire structure
          console.log("All mesh names from pack:", result.meshes.map(m => m.name)); // Log before filtering

          const filteredMeshes = result.meshes.filter(mesh => !mesh.name.startsWith("__"));
          const selectedModels = filteredMeshes.slice(0, 4); // Renamed to selectedModels for clarity

          console.log("Selected animal model names for state:", selectedModels.map(m => m.name));
          setLoadedAnimalModels(selectedModels);

          result.meshes.forEach(mesh => {
            mesh.setEnabled(false);
          });
        })
        .catch((error) => {
          console.error("Error loading animal models:", error);
        });
    }
  }, [scene]);

  return (
    <>
      <hemisphericLight name="light1" intensity={0.7} direction={Vector3.Up()} />
      <arcRotateCamera
        name="camera1"
        target={Vector3.Zero()}
        alpha={Math.PI / 2}
        beta={Math.PI / 4}
        radius={15}
        attachControl={true}
      />
    </>
  );
};

const GameBoardScene = (props) => ( // Accept props here
  <div style={{ flex: 1, display: 'flex' }}>
    <Engine antialias adaptToDeviceRatio canvasId="babylonJS">
      <Scene>
        {/* Pass playerSpaceIndices down to GameBoard */}
        <GameBoard playerSpaceIndices={props.playerSpaceIndices} />
      </Scene>
    </Engine>
  </div>
);

// boardSpacePositions is defined here, outside components, making it a module-level constant.
const boardSpacePositions = [
  new Vector3(-4, 0.5, 0), // Space 0
  new Vector3(-2, 0.5, 0), // Space 1
  new Vector3(0, 0.5, 0),  // Space 2
  new Vector3(2, 0.5, 0),  // Space 3
  new Vector3(4, 0.5, 0),  // Space 4
];

export { boardSpacePositions };
export default GameBoardScene;
