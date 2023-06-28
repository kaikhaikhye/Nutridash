// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const wallrun = (() => {

    class WallObject {
        constructor(params) {
            this.position = new THREE.Vector3(0, 0, 0);
            this.quaternion = new THREE.Quaternion();
            this.scale = 1.0;
            this.collider = new THREE.Box3();
            this.params_ = params;
            this.LoadModel_();
            this.mixer = null;
        }

        // load the model        
        LoadModel_() {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.setPath('./resources/Wall/');

            const texture = textureLoader.load('stg3_wallrun.png', () => {
                texture.flipY = false; // Adjust the texture's Y-axis orientation if needed
                texture.channel = 0; // Set the desired texture channel (in this case, channel 0)
            });
            const loader = new GLTFLoader();
            loader.setPath('./resources/Wall/');
            loader.load('stg3_wallrun.gltf', (gltf) => {
                console.log(gltf.scene.children[0].children[0])
                this.mesh = gltf.scene.children[0].children[0];
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

            })



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

    class WallManager {
        constructor(params) {
            this.objects_ = [];
            this.unused_ = [];
            this.speed_ = 12;
            this.params_ = params;
            this.counter_ = 0;
            this.spawn_ = 0;
        }

        GetColliders() {
            return this.objects_;
        }

        GetPosition(callback) {
            const positions = [];
            for (let i = 0; i < this.objects_.length; i++) {
                positions.push(this.objects_[i].position);
            }
            callback(positions);
        }

        SpawnObj_() {

            const spawnPosition = [225, 350, 370, 755, 777]
            let obj = null;
            let zPosition = 6.3; // initialize the zPosition to positive 5

            for (var i = 0; i < spawnPosition.length; i++) {
                if (this.counter_ == i) {
                    obj = new WallObject(this.params_);

                    obj.position.x = spawnPosition[i]
                    obj.position.y = 0
                    if (i == 0) {
                        obj.position.z = zPosition + 3; // set the zPosition for the object
                    }
                    if (i == 1) {
                        obj.position.z =  -zPosition
                    }
                    if (i == 2) {
                        obj.position.z =  zPosition + 3.7; // set the zPosition for the object
                    }
                    if (i == 3) {
                        obj.position.z =  zPosition + 4
                    }
                    if (i == 4) {
                        obj.position.z =  -zPosition; // set the zPosition for the object
                    }

               

                    if (zPosition > 0 && i % 2 === 1) {
                        obj.quaternion.setFromAxisAngle(
                            new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                    } else if (zPosition < 0 && i % 2 === 0) {
                        obj.quaternion.setFromAxisAngle(
                            new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                    } else if (zPosition > 0 && i % 2 === 0) {
                        obj.quaternion.setFromAxisAngle(
                            new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                    } else if (zPosition < 0 && i % 2 === 1) {
                        obj.quaternion.setFromAxisAngle(
                            new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                    }


                    if (i == 0) {
                        obj.scale = 0.008;
                    } else {
                        obj.scale = 0.011;
                    }

                    this.objects_.push(obj);
                    this.counter_++

                }
            }
        }


        Update(timeElapsed, speed) {
            this.SpawnObj_(this.params_.position)
            this.UpdateColliders_(timeElapsed, speed);
        }

        UpdateColliders_(timeElapsed, speed) {
            const invisible = [];
            const visible = [];
            for (let obj of this.objects_) {
                obj.position.x -= timeElapsed;

                if (obj.position.x < -890) {
                    invisible.push(obj);
                    obj.mesh.visible = false;
                } else {
                    visible.push(obj);
                }

                obj.Update(timeElapsed * 0.083);
            }

            this.objects_ = visible;
            this.unused_.push(...invisible);
        }

    };

    return {
        WallManager: WallManager,
    };
})();