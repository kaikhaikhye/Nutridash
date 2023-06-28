import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const waterGrade = (() => {

  class DrinksObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.drinks_ = []
      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();

    }

    //load the drinks
    LoadModel_() {

      const loader = new GLTFLoader();
      loader.setPath('./resources/Drinks/');
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setPath('./resources/Drinks/');


      const texture = textureLoader.load('nutrigrade_LOGO_colour.png', () => {
        texture.flipY = false; // Adjust the texture's Y-axis orientation if needed
        texture.channel = 0; // Set the desired texture channel (in this case, channel 0)
      });

      loader.load('nutrigrade_Logo.gltf', (gltf) => {
        this.mesh = gltf.scene.children[0]
        this.mesh.traverse(function (child) {
          if (child.isMesh) {
            child.material.opacity = 0.8;
            child.material.transparent = true;
          }
        });
        this.mesh.traverse(function (node) {
          if (node.isMesh) {
            // Swap shader to basic material
            const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 });

            // Decrease the brightness of the material
            const brightnessFactor = 0.6; // Value between 0 and 1 (0 = completely dark, 1 = original brightness)
            material.color.multiplyScalar(brightnessFactor);

            // Make sure to update the material to reflect the changes
            material.needsUpdate = true;

            node.material = material;

          }
        });
        this.params_.scene.add(this.mesh);


      },
      // called while loading is progressing
      function (xhr) {

      },
      // called when loading has errors
      function (error) {

        console.log(error);

      }
      );

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    }

    Update() {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();
    }
  }

  class DrinksManager {
    constructor(params) {
      this.objects_ = [];
      this.params_ = params;
      this.counter_ = 0;

      this.SpawnObj_(this.params_.position)

    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible(counter) {
      if(!this.objects_[counter].mesh){
        return;
      }
      this.objects_[counter].mesh.visible = false;

    }

    SpawnObj_(position) {
      var spawnPosition = [0]
      if (this.params_.stage == 1) {
        spawnPosition = [50, 65, 65, 80, 80, 95, 110, 125, 140, 155, 170, 185, 200, 215, 230, 230, 245, 245, 260, 260, 275, 290, 305, 320, 335, 350, 365, 380, 395, 410, 425, 440, 455, 470]
      } else if (this.params_.stage == 2) {
        spawnPosition = [54, 68, 82, 96, 96, 110, 110, 124, 124, 138, 138, 166, 166, 194, 208, 222, 222, 250, 278, 306, 306, 334, 334, 334, 362, 390, 390, 404, 418, 446, 474, 474, 502, 502, 530, 558]
      } else if (this.params_.stage == 3) {
        spawnPosition = [
          85, 85, 115, 145, 145, 175,
          205, 227, 295, 343, 358.5, 385,
          445, 505, 505, 535, 595, 655,
          670, 766, 820, 820, 835, 835,
          880
        ]
      }


      if (this.params_.firstChase) {
        for (let i = 0; i < spawnPosition.length; i++) {
          spawnPosition[i] += 40;
        }
      }
      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new DrinksObject(this.params_);

          obj.position.x = spawnPosition[i]
          obj.position.z = position[i]
          obj.position.y = 2.5
          if (this.params_.stage == 1) {
            if (i == 13 || i == 26 || i == 30) {
              obj.position.y += 2.5;
            }
          } else if (this.params_.stage == 2) {
            if (i == 7 ||i == 8 ||i == 10 || i == 13 || i == 18 || i == 21 || i == 24 || i == 27 || i == 28 || i == 34) {
              obj.position.y += 2.5;
            }
          } else if (this.params_.stage == 3) {
            if (i == 0 || i == 1 || i == 5 || i == 7 || i == 8 || i == 9 || i == 10 || i == 12 || i == 13 || i == 14 || i == 16 || i == 17 || i == 19) {
              obj.position.y += 2.5;
            }
          }

          obj.scale = 0.02;

          obj.quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), -Math.PI / 2);

          this.objects_.push(obj);
          this.counter_++
        }
      }

    }


    Update(timeElapsed) {
      this.UpdateColliders_(timeElapsed);

    }

    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];
      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }

        obj.Update(timeElapsed*0.083);
      }

      this.objects_ = visible;
    }


  };

  return {
    DrinksManager: DrinksManager,
  };
})();