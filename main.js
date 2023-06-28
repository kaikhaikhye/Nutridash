import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/stats.js/src/Stats.js'
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js"

import { player } from './world_objects/player.js';
import { shoogaGlider } from './world_objects/monster/shoogaGlider.js';
import { trolliumChloride } from './world_objects/monster/trolliumChloride.js';
import { pitfall } from './world_objects/obstacle/pitfall.js';
import { wallrun } from './world_objects/obstacle/wallrun.js';

import { cloud } from './world_objects/cloud.js';
import { sky } from './world_objects/sky.js';

import { progression } from './world_objects/progression.js';
import { water } from './world_objects/drinks/water.js';
import { waterGrade } from './world_objects/drinks/water_grade.js';
import { fruitDrinkGrade } from './world_objects/drinks/fruitDrink_grade.js';
import { sodaGrade } from './world_objects/drinks/soda_grade.js';

import { soda } from './world_objects/drinks/soda.js';
import { fruitDrink } from './world_objects/drinks/fruitDrink.js';
import { hpbLogo } from './world_objects/logo_box/boxHPB.js';
import { hpbWrongLogo1 } from './world_objects/logo_box/boxWrong1.js';
import { hpbWrongLogo2 } from './world_objects/logo_box/boxWrong2.js';
import { oilSlik } from './world_objects/monster/OilSlik.js';
import { carbs } from './world_objects/food/carbs.js';
import { meat } from './world_objects/food/meat.js';
import { vege } from './world_objects/food/vege.js';

const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;



class BasicWorldDemo {
  constructor() {

    //game end & you win & after video count down
    this.countdown2_ = 6;
    this.countdown1_ = 6;
    this.countdown0_ = 6;

    this.totalStamina = 0;
    this.stopTime = true;
    this.resumeCountdown_ = 3;
    this.intervalId_ = null;

    //first load
    this.firstLoad = true;
    this.showChase = true;
    this.cameraX = -10;
    this.cameraY = 5;
    this.cameraZ = 0;

    //pause
    this.allowPause = false;

    //load assets & world variables 
    this.loaded = false;
    this.gender_ = null;
    this.stage = 1;
    this.wallPosition = [];
    // this.oilSlikCatch = false

    //init
    this._gameStarted = false;
    this._Initialize();
    this.checkStartGame = false;
    this._showGender = false;
    this.failedStage = false;
    this.stage1lose = false;
    //loading bars
    this.progressBarContainer = document.getElementById('loading-bar-container');


    //on load music 
    this.splashScreenMusic = document.getElementById("splash-screen-music");
    this.splashScreenMusic.volume = 0.24

    this.stage1Music = document.getElementById("stage1-music")
    this.stage1Music.volume = 0.35

    this.stage2Music = document.getElementById("stage2-music")
    this.stage2Music.volume = 0.35

    this.stage3Music = document.getElementById("stage3-music")
    this.stage3Music.volume = 0.35

    this.splashScreenMusicToggle = false;
    window.addEventListener('touchstart', () => {
      if ((/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) && !this.splashScreenMusicToggle) {
        // code to execute if the platform is iOS
        this._playSplashScreenMusic();
      }

    })

    //start game event listeners
    document.addEventListener('keydown', () => {
      if (!this._gameStarted) {
        this.splashScreenMusic.pause()
        var progressBarContainer = document.getElementById('progress-bar-container');
        if (window.getComputedStyle(progressBarContainer).display === 'none') {
          if (!this._showGender) {
            this._showGender = true;
            document.getElementById('game-menu').style.display = 'none';
            this.playNextStageVideo1()
            document.getElementById('video-container').style.display = 'block';
          }
        }
      }
    });

    document.addEventListener('click', () => {
      this.splashScreenMusic.pause()
      var progressBarContainer = document.getElementById('progress-bar-container');
      if (window.getComputedStyle(progressBarContainer).display === 'none') {
        if (!this._showGender) {
          this._showGender = true;
          document.getElementById('game-menu').style.display = 'none';
          this.playNextStageVideo1()
          document.getElementById('video-container').style.display = 'block';
        }
      }

    });




    //handle gender selection
    document.getElementById('boy-unselected').addEventListener('click', () => {
      var soundSelect = document.getElementById("sound-selection");
      soundSelect.play();
      this.gender_ = "male"
      document.getElementById("select-gender").style.display = 'inline-block';
      document.getElementById('boy-unselected').style.display = 'none';
      document.getElementById('boy-selected').style.display = 'inline-block';
      if (document.getElementById('girl-selected').style.display == 'inline-block') {
        document.getElementById('girl-unselected').style.display = 'inline-block';
        document.getElementById('girl-selected').style.display = 'none'
      }

    });

    document.getElementById('girl-unselected').addEventListener('click', () => {
      var soundSelect = document.getElementById("sound-selection");
      soundSelect.play();
      this.gender_ = "female"
      document.getElementById("select-gender").style.display = 'inline-block';
      document.getElementById('girl-unselected').style.display = 'none';
      document.getElementById('girl-selected').style.display = 'inline-block';
      if (document.getElementById('boy-selected').style.display == 'inline-block') {
        document.getElementById('boy-unselected').style.display = 'inline-block';
        document.getElementById('boy-selected').style.display = 'none'

      }
    });

    //handle start game (male)
    document.getElementById('select-gender').addEventListener('click', () => {
      if (this.gender_ === 'male' || this.gender_ === 'female') {
        var soundSelect = document.getElementById("sound-click");
        soundSelect.play();
        var soundAgentBgm = document.getElementById("sound-agentBgm");
        soundAgentBgm.play();
        this.splashScreenMusic.pause();
        this.splashScreenMusicToggle = true;
        document.getElementById('video-container').style.display = 'block';
        document.getElementById('player-ui').style.display = 'block';

        document.getElementById('gender-selection').style.display = 'none';
        this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
        if (this.firstLoad) {
          this.firstLoad = false;
          this.closeNextStageVideo1();
          document.getElementById('loading-1').style.display = 'block';

          // start loading variables
          this.stopTime = false
          this.RAF_()
          this.progressBarContainer.style.display = 'block';
          const progressBar = document.getElementById('loading-bar-stage-1');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 74) {
              // Calculate the loading progress as a percentage of the maximum value
              const progressPercentage = (loadingProgress / 74) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.startGame = true;
              this.stopTime = true;
              var soundAgent = document.getElementById("sound-agent1");
              soundAgent.play();

              // text type writer 
              var textElement = document.getElementById('stage1-intro1-text1');
              var textElement1 = document.getElementById('stage1-intro1-text2');
              var textElement2 = document.getElementById('stage1-intro1-text3');

              textElement.textContent = '';
              var textToType = "• Hi, my name is SOFIA and I'm here to help. ";
              var typingSpeed = 10;
              var i = 0;
              var intervalId = setInterval(function () {
                textElement.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  i = 0
                  clearInterval(intervalId);
                  textToType = "BEEFTEKI";
                  intervalId = setInterval(function () {
                    textElement1.textContent += textToType.charAt(i);
                    i++;
                    if (i >= textToType.length) {
                      i = 0

                      clearInterval(intervalId);
                      textToType = "is after you - avoid him!";
                      intervalId = setInterval(function () {
                        textElement2.textContent += textToType.charAt(i);
                        i++;
                        if (i >= textToType.length) {
                          clearInterval(intervalId);
                          document.getElementById('loading1-next').style.display = 'block';
                        }
                      }, typingSpeed);
                    }
                  }, typingSpeed);
                }
              }, typingSpeed);

              document.dispatchEvent(new CustomEvent('score-over'));
              if (this.gender_ == "male") {
                document.getElementById('boyHUD').style.display = 'block'
              } else if (this.gender_ == "female") {
                document.getElementById('girlHUD').style.display = 'block'
              }
            }

          }, 50);

        }
      }
    });



    // swipe gesture variables and event listeners
    this.swipeLeft = false;
    this.swipeRight = false;
    this.swipeUp = false;
    this.swipeDown = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.minDistance = 100;
    this.isSwiping = false;
    this.isPaused = false;

    document.addEventListener('touchstart', (event) => {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
      if (this.isSwiping) {
        return;
      }
      if (this.showChase) {
        return;
      }


      console.log("jump")
      this.endX = event.changedTouches[0].clientX;
      this.endY = event.changedTouches[0].clientY;

      this.deltaX = this.endX - this.startX;
      this.deltaY = this.endY - this.startY;
      this.absDeltaX = Math.abs(this.deltaX);
      this.absDeltaY = Math.abs(this.deltaY);

      if (this.absDeltaX > this.minDistance || this.absDeltaY > this.minDistance) {
        if (this.absDeltaX < this.absDeltaY) {
          if (this.deltaY > 0 && !this.player_.inAir_) {
            this.swipeDown = true;
            return;

          } else if (!this.player_.inAir_) {
            this.swipeUp = true;
            return;

          }
        }
        if (this.absDeltaX > this.absDeltaY) {
          if (this.deltaX > 0) {
            if (this.player_.position_.z == 3) {
              return
            }
            this.player_.keys_.right = true;
          } else {
            if (this.player_.position_.z == -3) {
              return
            }
            this.player_.keys_.left = true;
          }
        }
      }

    }, { passive: false });


    //next stage cut scenes
    this.nextStageVideo1_ = document.getElementById("nextStage1");
    this.nextStageVideo2_ = document.getElementById("nextStage2");
    this.nextStageVideo3_ = document.getElementById("nextStage3");
    this.nextStageVideo4_ = document.getElementById("nextStage4");

    // if next stage video ends, then unpause everything
    this.nextStageVideo1_.addEventListener("ended", () => {
      if (!this._gameStarted) {
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('video-container').style.display = 'none';

      } else {

        this.closeNextStageVideo1();
        var soundAgentBgm = document.getElementById("sound-agentBgm");
        soundAgentBgm.play();
        document.getElementById('loading-1').style.display = 'block';
        document.getElementById('stage1-intro1').style.display = 'block';
        document.getElementById('loading-bar-container').style.display = 'block';
        document.getElementById('loading-text-stage-1').style.display = 'block';
        var textElement = document.getElementById('stage1-intro1-text1');
        var textElement1 = document.getElementById('stage1-intro1-text2');
        var textElement2 = document.getElementById('stage1-intro1-text3');

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';

        while (this.scene_.children.length > 0) {
          this.scene_.remove(this.scene_.children[0]);
        }

      }
      this.closeNextStageVideo1();
    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo2_.addEventListener("ended", () => {
      this.closeNextStageVideo2();
      document.getElementById('loading1-next').style.display = 'none';
      var soundAgentBgm = document.getElementById("sound-agentBgm");
      soundAgentBgm.play();
      document.getElementById('loading-2').style.display = 'block';
      document.getElementById('stage2-intro1').style.display = 'block';
      document.getElementById('loading2-next').style.display = 'none';
      document.getElementById('loading-button-container').style.display = 'block';

      document.getElementById('loading-bar-container-2').style.display = 'block';
      document.getElementById('loading-text-stage-2').style.display = 'block';
      // text type writer 
      var textElement = document.getElementById('stage2-intro1-text1');
      var textElement1 = document.getElementById('stage2-intro1-text2');
      var textElement2 = document.getElementById('stage2-intro1-text3');
      var textElement3 = document.getElementById('stage2-intro1-text4');

      textElement.textContent = '';
      textElement1.textContent = '';
      textElement2.textContent = '';
      textElement3.textContent = '';


    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo3_.addEventListener("ended", () => {
      this.closeNextStageVideo3();
      document.getElementById('loading2-next').style.display = 'none';
      var soundAgentBgm = document.getElementById("sound-agentBgm");
      soundAgentBgm.play();
      document.getElementById('loading-3').style.display = 'block';
      document.getElementById('stage3-intro1').style.display = 'block';
      document.getElementById('loading3-next').style.display = 'none';
      document.getElementById('loading-button-container').style.display = 'block';
      document.getElementById('loading-bar-container-3').style.display = 'block';
      document.getElementById('loading-text-stage-3').style.display = 'block';
      // text type writer 
      var textElement = document.getElementById('stage3-intro1-text1');
      var textElement1 = document.getElementById('stage3-intro1-text2');
      var textElement2 = document.getElementById('stage3-intro1-text3');
      var textElement3 = document.getElementById('stage3-intro1-text4');

      textElement.textContent = '';
      textElement1.textContent = '';
      textElement2.textContent = '';
      textElement3.textContent = '';

    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo4_.addEventListener("ended", () => {
      this.closeNextStageVideo4();
      this.stopTime = true
      this.Pause()
      document.getElementById('loading3-next').style.display = 'none';

      //  document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;
      document.getElementById("volume-container").style.display = 'none';
      document.getElementById('final-score-good-ending').classList.toggle('active');
      document.getElementById('goodEndingUI').style.zIndex = 3;

      if (this.gender_ == "male") {
        document.getElementById('boyHUD').style.display = 'none'
      } else if (this.gender_ == "female") {
        document.getElementById('girlHUD').style.display = 'none'
      }

    });



  }

  //stage 1 cutscene
  playNextStageVideo1() {
    this.nextStageVideo1_.style.display = "block";
    this.nextStageVideo1_.play();
    if (this.checkRestart || this.failedStage) {
      this.nextStageVideo1_.currentTime = this.nextStageVideo1_.duration;
    }
    this.NotFirstTry = false;

  }

  closeNextStageVideo1() {
    this.nextStageVideo1_.style.display = "none";
    this.nextStageVideo1_.currentTime = 0;
    this.nextStageVideo1_.pause();
  }


  //stage 2 cutscene
  playNextStageVideo2() {
    this.nextStageVideo2_.style.display = "block";
    pauseButton.style.display = 'none'
    this.nextStageVideo2_.play()
    if (this.checkRestart || this.failedStage) {
      this.nextStageVideo2_.currentTime = this.nextStageVideo2_.duration;
    }
    while (this.scene_.children.length > 0) {
      this.scene_.remove(this.scene_.children[0]);
    }
    this.NotFirstTry = false;

  }

  closeNextStageVideo2() {
    this.nextStageVideo2_.style.display = "none";
    this.nextStageVideo2_.currentTime = 0;
    this.nextStageVideo2_.pause();
  }

  //stage 3 cutscene
  playNextStageVideo3() {
    this.nextStageVideo3_.style.display = "block";
    pauseButton.style.display = 'none'
    this.nextStageVideo3_.play();
    if (this.checkRestart || this.failedStage) {
      this.nextStageVideo3_.currentTime = this.nextStageVideo3_.duration;
    }
    while (this.scene_.children.length > 0) {
      this.scene_.remove(this.scene_.children[0]);
    }
    this.NotFirstTry = false;

  }

  closeNextStageVideo3() {
    this.nextStageVideo3_.style.display = "none";
    this.nextStageVideo3_.currentTime = 0;
    this.nextStageVideo3_.pause();

  }


  //victory videos or defeat videos
  playVictoryVid() {
    pauseButton.style.display = 'none'
    this.nextStageVideo4_.style.display = "block";
    this.nextStageVideo4_.play();
    while (this.scene_.children.length > 0) {
      this.scene_.remove(this.scene_.children[0]);
    }
    this.NotFirstTry = false;

  }

  closeNextStageVideo4() {
    this.nextStageVideo4_.style.display = "none";
    this.nextStageVideo4_.currentTime = 0;
    this.nextStageVideo4_.pause();
  }


  //music player
  _playSplashScreenMusic() {
    this.splashScreenMusic.play();
  }

  //start the game
  _OnStart() {
    this._gameStarted = true;
    this.stage1Music.play();
  }

  //check IOS
  isMobileIOS() {
    const userAgent = navigator.userAgent;
    const isMobile = /android|iPad|iPhone|iPod|Windows Phone|iemobile|mobile/i.test(userAgent);

    return isMobile;
  }

  isIpadOS() {
    return navigator.userAgent.match(/Mac/) && navigator.maxTouchPoints && navigator.maxTouchPoints > 2
  }


  //initialize the game
  _Initialize() {
    //speed variables
    this.box_ = "";
    this.objSpeed = 0.2;
    this.buffspeed = false;
    this.startstage = false;
    this.allowStart = false;

    // renderer
    this.threejs_ = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: false,
      alpha: false,
      precision: 'lowp',
    });
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.threejs_.gammaFactor = 0.7;
    this.threejs_.shadowMap.enabled = false;
    // this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setPixelRatio(0.9);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    //responsive
    document.getElementById('container').appendChild(this.threejs_.domElement);
    window.addEventListener('orientationchange', () => {
      if (window.orientation === 0 || window.orientation === 180) {
        this.OnWindowResize_();
      } else if (window.orientation === 90 || window.orientation === -90) {
        this.OnWindowResize_();
      } else {
        this.OnWindowResize_();

      }
    });

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);


    //camera
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000;

    // Define the shake parameters
    this.shakeIntensity = 0.2; // The maximum displacement amount
    this.shakeDuration = 0.5; // The duration of the shake in seconds
    this.shakeTime = 0; // The current time of the shake effect
    this.shakeInterval = 0; // The interval timer for the shake effect

    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(this.cameraX, this.cameraY, this.cameraZ);
    this.camera_.lookAt(0, this.cameraY, 0);

    //scene
    this.scene_ = new THREE.Scene();

    this.beamTexture = new THREE.TextureLoader()

    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.castShadow = false;

    this.scene_.add(light);

    light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
    this.scene_.add(light);

    light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
    light.position.set(-7, 20, 0);
    this.scene_.add(light);

    this.scene_.background = new THREE.Color(0x808080);

    //load map
    const loader = new GLTFLoader();
    loader.setPath('./resources/Map/Stage1/');
    loader.load('stg1_A.gltf', (gltf) => {
      this.mesh = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh.position.set(-45, 0, 0);
      this.mesh.rotation.set(0, -Math.PI / 2, 0);
      this.mesh.scale.setScalar(0.01);
      this.scene_.add(this.mesh);

    });

    loader.load('stg1_B.gltf', (gltf) => {
      this.mesh1 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh1.position.set(165, 0, -0.1);
      this.mesh1.rotation.set(0, -Math.PI / 2, 0);
      this.mesh1.scale.setScalar(0.01);


      this.scene_.add(this.mesh1);

    });
    loader.load('stg1_B.gltf', (gltf) => {
      this.mesh2 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh2.position.set(375, 0, 0);
      this.mesh2.rotation.set(0, -Math.PI / 2, 0);
      this.mesh2.scale.setScalar(0.01);


      this.scene_.add(this.mesh2);

    });
    loader.load('stg1_exit.gltf', (gltf) => {
      this.mesh3 = gltf.scene;
      this.mesh3.position.set(560, -0.1, 0);
      this.mesh3.rotation.set(0, -Math.PI / 2, 0);
      this.mesh3.scale.setScalar(0.01);

      this.scene_.add(this.mesh3);
    });

    const uniforms = {
      topColor: { value: new THREE.Color(0xFCF7E2) },
      bottomColor: { value: new THREE.Color(0xCFE9E0) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: _VS,
      fragmentShader: _FS,
      side: THREE.BackSide,
    });
    this.scene_.add(new THREE.Mesh(skyGeo, skyMat));

    //pause DOM elements
    var pauseButton = document.getElementById("pauseButton");
    var volumeButton = document.getElementById("volumeButton");
    var muteButton = document.getElementById("muteButton");
    var quitButton = document.getElementById("quitBtn");
    var restartButton = document.getElementById("restartBtn");
    var continueButton = document.getElementById("continueBtn");
    var retryStage3 = document.getElementById("retry-stage-3");
    var continueEnding = document.getElementById("continue-ending");
    var finishEnding = document.getElementById("finish-ending");
    var nextEnding = document.getElementById("final-score-next");
    var nextRestart = document.getElementById("final-score-restart");
    var loading1Next = document.getElementById('loading1-next')
    var loading2Next = document.getElementById('loading2-next')
    var loading3Next = document.getElementById('loading3-next')

    var nextButtonCounter = 0;
    var loading1nextButtonCounter = 0;
    var loading2nextButtonCounter = 0;
    var loading3nextButtonCounter = 0;

    // Add event listeners to the buttons
    loading1Next.addEventListener("click", () => {
      loading1Next.style.display = 'none'
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();

      if (loading1nextButtonCounter == 0) {
        document.getElementById('stage1-intro1').style.display = 'none'
        document.getElementById('stage1-intro2').style.display = 'block'
        loading1nextButtonCounter++

        var textElement = document.getElementById('stage1-intro2-text1')
        var textElement1 = document.getElementById('stage1-intro2-text2')
        var textElement2 = document.getElementById('stage1-intro2-text3')
        var textElement3 = document.getElementById('stage1-intro2-text4')
        var textElement4 = document.getElementById('stage1-intro2-text5')
        var textElement5 = document.getElementById('stage1-intro2-text6')
        var textElement6 = document.getElementById('stage1-intro2-text7')
        var textElement7 = document.getElementById('stage1-intro2-text8')
        var textElement8 = document.getElementById('stage1-intro2-text9')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';
        textElement4.textContent = '';
        textElement5.textContent = '';
        textElement6.textContent = '';
        textElement7.textContent = '';
        textElement8.textContent = '';

        var soundAgent = document.getElementById("sound-agent2");
        soundAgent.play();

        var textToType = "• Use the [Left Arrow] and [Right";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0
            clearInterval(intervalId);
            textToType = " Arrow] to move";
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                i = 0
                clearInterval(intervalId);
                textToType = "LEFT";
                intervalId = setInterval(function () {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    i = 0
                    clearInterval(intervalId);
                    textToType = "and";
                    intervalId = setInterval(function () {
                      textElement3.textContent += textToType.charAt(i);
                      i++;
                      if (i >= textToType.length) {
                        i = 0
                        clearInterval(intervalId);
                        textToType = "RIGHT";
                        intervalId = setInterval(function () {
                          textElement4.textContent += textToType.charAt(i);
                          i++;
                          if (i >= textToType.length) {
                            clearInterval(intervalId);
                            i = 0
                            textToType = "and avoid obstacles! ";
                            intervalId = setInterval(function () {
                              textElement5.textContent += textToType.charAt(i);
                              i++;
                              if (i >= textToType.length) {
                                clearInterval(intervalId);
                                i = 0
                                textToType = "• Press [Spacebar] or [Up Arrow] to";
                                intervalId = setInterval(function () {
                                  textElement6.textContent += textToType.charAt(i);
                                  i++;
                                  if (i >= textToType.length) {
                                    i = 0
                                    clearInterval(intervalId);
                                    textToType = "JUMP";
                                    intervalId = setInterval(function () {
                                      textElement7.textContent += textToType.charAt(i);
                                      i++;
                                      if (i >= textToType.length) {
                                        i = 0
                                        clearInterval(intervalId);
                                        textToType = "over obstacles!";
                                        intervalId = setInterval(function () {
                                          textElement8.textContent += textToType.charAt(i);
                                          i++;
                                          if (i >= textToType.length) {
                                            clearInterval(intervalId);
                                            document.getElementById('loading1-next').style.display = 'block';
                                          }
                                        }, typingSpeed);
                                      }
                                    }, typingSpeed);
                                  }
                                }, typingSpeed);
                              }
                            }, typingSpeed);
                          }
                        }, typingSpeed);
                      }
                    }, typingSpeed);
                  }
                }, typingSpeed);
              }
            }, typingSpeed);

          }
        }, typingSpeed);
      } else if (loading1nextButtonCounter == 1) {
        loading1nextButtonCounter++
        document.getElementById('stage1-intro2').style.display = 'none'
        document.getElementById('stage1-intro3').style.display = 'block'


        var textElement = document.getElementById('stage1-intro3-text1')
        var textElement1 = document.getElementById('stage1-intro3-text2')
        var textElement2 = document.getElementById('stage1-intro3-text3')
        var textElement3 = document.getElementById('stage1-intro3-text4')
        var textElement4 = document.getElementById('stage1-intro3-text5')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';
        textElement4.textContent = '';

        var soundAgent = document.getElementById("sound-agent3");
        soundAgent.play();

        var textToType = "• Stay hydrated with";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(() => {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            i = 0;
            textToType = "WATER"
            intervalId = setInterval(() => {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                clearInterval(intervalId);
                i = 0;
                textToType = "• Plain water is always the best"
                intervalId = setInterval(() => {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    i = 0;
                    textToType = "choice so avoid sweetened"
                    intervalId = setInterval(() => {
                      textElement3.textContent += textToType.charAt(i);
                      i++;
                      if (i >= textToType.length) {
                        clearInterval(intervalId);
                        i = 0;
                        textToType = "beverages!"

                        intervalId = setInterval(() => {
                          textElement4.textContent += textToType.charAt(i);
                          i++;
                          if (i >= textToType.length) {
                            clearInterval(intervalId);
                            document.getElementById('click-start').style.display = 'block';
                            document.getElementById('loading-bar-container').style.display = 'none';
                            document.getElementById('loading-text-stage-1').style.display = 'none';

                            this.allowStart = true;
                            loading1nextButtonCounter = 0
                            i = 0;
                          }
                        }, typingSpeed);
                      }
                    }, typingSpeed);
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed);
      }
    });

    loading2Next.addEventListener("click", () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      loading2Next.style.display = 'none'
      if (loading2nextButtonCounter == 0) {
        loading2nextButtonCounter++

        document.getElementById('stage2-intro1').style.display = 'none'
        document.getElementById('stage2-intro2').style.display = 'block'


        var textElement = document.getElementById('stage2-intro2-text1');
        var textElement1 = document.getElementById('stage2-intro2-text2');
        var textElement2 = document.getElementById('stage2-intro2-text3');
        var textElement3 = document.getElementById('stage2-intro2-text4');
        var textElement4 = document.getElementById('stage2-intro2-text5');
        var textElement5 = document.getElementById('stage2-intro2-text6');
        var textElement6 = document.getElementById('stage2-intro2-text7');
        var textElement7 = document.getElementById('stage2-intro2-text8');
        var textElement8 = document.getElementById('stage2-intro2-text9');

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';
        textElement4.textContent = '';
        textElement5.textContent = '';
        textElement6.textContent = '';
        textElement7.textContent = '';
        textElement8.textContent = '';

        var soundAgent = document.getElementById("sound-agent5");
        soundAgent.play();

        var textToType = "• NICE WORK! NOW THAT YOU HAVE THE ";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(() => {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0
            clearInterval(intervalId);
            textToType = "NUTRI-SHIELD"
            intervalId = setInterval(() => {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                i = 0

                clearInterval(intervalId);
                textToType = "you are protected against attacks for a few seconds."
                intervalId = setInterval(() => {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    i = 0
                    textToType = "• To charge it, follow the 'My Healthy Plate' formula: ";
                    intervalId = setInterval(() => {
                      textElement3.textContent += textToType.charAt(i);
                      i++;
                      if (i >= textToType.length) {
                        clearInterval(intervalId);
                        i = 0

                        textToType = "¼ grains";
                        intervalId = setInterval(() => {
                          textElement4.textContent += textToType.charAt(i);
                          i++;
                          if (i >= textToType.length) {
                            clearInterval(intervalId);
                            i = 0
                            textToType = ",";
                            intervalId = setInterval(() => {
                              textElement5.textContent += textToType.charAt(i);
                              i++;
                              if (i >= textToType.length) {
                                clearInterval(intervalId);
                                i = 0
                                textToType = "¼ protein";
                                intervalId = setInterval(() => {
                                  textElement6.textContent += textToType.charAt(i);
                                  i++;
                                  if (i >= textToType.length) {
                                    i = 0
                                    clearInterval(intervalId);
                                    textToType = ",";
                                    intervalId = setInterval(() => {
                                      textElement7.textContent += textToType.charAt(i);
                                      i++;
                                      if (i >= textToType.length) {
                                        i = 0
                                        clearInterval(intervalId);
                                        textToType = "½ FRUIT AND VEG";
                                        intervalId = setInterval(() => {
                                          textElement8.textContent += textToType.charAt(i);
                                          i++;
                                          if (i >= textToType.length) {
                                            clearInterval(intervalId);
                                            document.getElementById('loading2-next').style.display = 'block';
                                          }
                                        }, typingSpeed);
                                      }
                                    }, typingSpeed);
                                  }
                                }, typingSpeed);
                              }
                            }, typingSpeed);
                          }
                        }, typingSpeed);
                      }
                    }, typingSpeed);
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed)
      } else if (loading2nextButtonCounter == 1) {
        loading2nextButtonCounter++
        document.getElementById('stage2-intro2').style.display = 'none'
        document.getElementById('stage2-intro3').style.display = 'block'

        var textElement = document.getElementById('stage2-intro3-text1');
        var textElement1 = document.getElementById('stage2-intro3-text2');
        var textElement2 = document.getElementById('stage2-intro3-text3');
        var textElement3 = document.getElementById('stage2-intro3-text4');
        var textElement4 = document.getElementById('stage2-intro3-text5');
        var textElement5 = document.getElementById('stage2-intro3-text6');
        var textElement6 = document.getElementById('stage2-intro3-text7');
        var textElement7 = document.getElementById('stage2-intro3-text8');
        var textElement8 = document.getElementById('stage2-intro3-text9');
        var textElement9 = document.getElementById('stage2-intro3-text10');
        var textElement10 = document.getElementById('stage2-intro3-text11');
        var textElement11 = document.getElementById('stage2-intro3-text12');
        var textElement12 = document.getElementById('stage2-intro3-text13');
        var textElement13 = document.getElementById('stage2-intro3-text14');
        var textElement14 = document.getElementById('stage2-intro3-text15');
        var textElement15 = document.getElementById('stage2-intro3-text16');

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';
        textElement4.textContent = '';
        textElement5.textContent = '';
        textElement6.textContent = '';
        textElement7.textContent = '';
        textElement8.textContent = '';
        textElement9.textContent = '';
        textElement10.textContent = '';
        textElement11.textContent = '';
        textElement12.textContent = '';
        textElement13.textContent = '';
        textElement14.textContent = '';
        textElement15.textContent = '';

        var soundAgent = document.getElementById("sound-agent6");
        soundAgent.play();

        var textToType = "• But be careful, ";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(() => {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0
            clearInterval(intervalId);
            textToType = "TERROLATO"
            intervalId = setInterval(() => {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                i = 0

                clearInterval(intervalId);
                textToType = "and"
                intervalId = setInterval(() => {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    i = 0
                    textToType = "SOYAS";
                    intervalId = setInterval(() => {
                      textElement3.textContent += textToType.charAt(i);
                      i++;
                      if (i >= textToType.length) {
                        clearInterval(intervalId);
                        i = 0

                        textToType = "live in this dungeon.";
                        intervalId = setInterval(() => {
                          textElement4.textContent += textToType.charAt(i);
                          i++;
                          if (i >= textToType.length) {
                            clearInterval(intervalId);
                            i = 0
                            textToType = "• Press [Down Arrow] to";
                            intervalId = setInterval(() => {
                              textElement5.textContent += textToType.charAt(i);
                              i++;
                              if (i >= textToType.length) {
                                clearInterval(intervalId);
                                i = 0
                                textToType = "SLIDE";
                                intervalId = setInterval(() => {
                                  textElement6.textContent += textToType.charAt(i);
                                  i++;
                                  if (i >= textToType.length) {
                                    i = 0
                                    clearInterval(intervalId);
                                    textToType = "and";
                                    intervalId = setInterval(() => {
                                      textElement7.textContent += textToType.charAt(i);
                                      i++;
                                      if (i >= textToType.length) {
                                        i = 0
                                        clearInterval(intervalId);
                                        textToType = "avoid";
                                        intervalId = setInterval(() => {
                                          textElement8.textContent += textToType.charAt(i);
                                          i++;
                                          if (i >= textToType.length) {
                                            i = 0
                                            clearInterval(intervalId);
                                            textToType = "TERROLATO";
                                            intervalId = setInterval(() => {
                                              textElement9.textContent += textToType.charAt(i);
                                              i++;
                                              if (i >= textToType.length) {
                                                i = 0
                                                clearInterval(intervalId);
                                                textToType = "attacks.";
                                                intervalId = setInterval(() => {
                                                  textElement10.textContent += textToType.charAt(i);
                                                  i++;
                                                  if (i >= textToType.length) {
                                                    i = 0
                                                    clearInterval(intervalId);
                                                    textToType = "•";
                                                    intervalId = setInterval(() => {
                                                      textElement11.textContent += textToType.charAt(i);
                                                      i++;
                                                      if (i >= textToType.length) {
                                                        i = 0
                                                        clearInterval(intervalId);
                                                        textToType = "JUMP";
                                                        intervalId = setInterval(() => {
                                                          textElement12.textContent += textToType.charAt(i);
                                                          i++;
                                                          if (i >= textToType.length) {
                                                            i = 0
                                                            clearInterval(intervalId);
                                                            textToType = "just before his swipe to avoid";
                                                            intervalId = setInterval(() => {
                                                              textElement13.textContent += textToType.charAt(i);
                                                              i++;
                                                              if (i >= textToType.length) {
                                                                i = 0
                                                                clearInterval(intervalId);
                                                                textToType = "SOYAS";
                                                                intervalId = setInterval(() => {
                                                                  textElement14.textContent += textToType.charAt(i);
                                                                  i++;
                                                                  if (i >= textToType.length) {
                                                                    i = 0
                                                                    clearInterval(intervalId);
                                                                    textToType = "attacks.";
                                                                    intervalId = setInterval(() => {
                                                                      textElement15.textContent += textToType.charAt(i);
                                                                      i++;
                                                                      if (i >= textToType.length) {
                                                                        clearInterval(intervalId);
                                                                        document.getElementById('click-start').style.display = 'block';
                                                                        document.getElementById('loading-bar-container-2').style.display = 'none';
                                                                        document.getElementById('loading-text-stage-2').style.display = 'none';
                                                                        document.querySelector('.wrapper').style.display = 'block';
                                                                        document.getElementById('shieldContainer').style.display = 'block';
                                                                        loading2nextButtonCounter = 0;
                                                                        i = 0
                                                                        this.allowStart = true;
                                                                      }
                                                                    }, typingSpeed);
                                                                  }
                                                                }, typingSpeed);
                                                              }
                                                            }, typingSpeed);
                                                          }
                                                        }, typingSpeed);
                                                      }
                                                    }, typingSpeed);
                                                  }
                                                }, typingSpeed);
                                              }
                                            }, typingSpeed);
                                          }
                                        }, typingSpeed);
                                      }
                                    }, typingSpeed);
                                  }
                                }, typingSpeed);
                              }
                            }, typingSpeed);
                          }
                        }, typingSpeed);
                      }
                    }, typingSpeed);
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed)
      }
    });


    loading3Next.addEventListener("click", () => {
      loading3Next.style.display = 'none'
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      if (loading3nextButtonCounter == 0) {
        document.getElementById('stage3-intro1').style.display = 'none'
        document.getElementById('stage3-intro2').style.display = 'block'
        loading3nextButtonCounter++

        var textElement = document.getElementById('stage3-intro2-text1')
        var textElement1 = document.getElementById('stage3-intro2-text2')
        var textElement2 = document.getElementById('stage3-intro2-text3')
        var textElement3 = document.getElementById('stage3-intro2-text4')
        var textElement4 = document.getElementById('stage3-intro2-text5')
        var textElement5 = document.getElementById('stage3-intro2-text6')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';
        textElement4.textContent = '';
        textElement5.textContent = '';

        var soundAgent = document.getElementById("sound-agent8");
        soundAgent.play();

        var textToType = "• Uh oh! Seems like taking the ";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            i = 0
            textToType = 'PORTAL KEY';
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                clearInterval(intervalId);
                i = 0
                textToType = "activated some sort of self-destruct sequence. You'll need to hurry!";
                intervalId = setInterval(function () {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    i = 0
                    textToType = '• Jump and move left or right to';
                    intervalId = setInterval(function () {
                      textElement3.textContent += textToType.charAt(i);
                      i++;
                      if (i >= textToType.length) {
                        clearInterval(intervalId);
                        i = 0
                        textToType = 'WALL RUN';
                        intervalId = setInterval(function () {
                          textElement4.textContent += textToType.charAt(i);
                          i++;
                          if (i >= textToType.length) {
                            clearInterval(intervalId);
                            i = 0
                            textToType = 'to avoid falling down the crumbling paths!';
                            intervalId = setInterval(function () {
                              textElement5.textContent += textToType.charAt(i);
                              i++;
                              if (i >= textToType.length) {
                                clearInterval(intervalId);
                                document.getElementById('loading3-next').style.display = 'block';
                              }
                            }, typingSpeed)
                          }
                        }, typingSpeed)
                      }
                    }, typingSpeed)
                  }
                }, typingSpeed)
              }
            }, typingSpeed)
          }
        }, typingSpeed);
      } else if (loading3nextButtonCounter == 1) {
        loading3nextButtonCounter++
        document.getElementById('stage3-intro2').style.display = 'none'
        document.getElementById('stage3-intro3').style.display = 'block'


        var textElement = document.getElementById('stage3-intro3-text1')
        var textElement1 = document.getElementById('stage3-intro3-text2')
        var textElement2 = document.getElementById('stage3-intro3-text3')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        var soundAgent = document.getElementById("sound-agent9");
        soundAgent.play();
        var textToType = "• Pick the correct";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(() => {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            i = 0
            textToType = 'HEALTHIER CHOICE SYMBOL';
            intervalId = setInterval(() => {
              textElement1.textContent += textToType.charAt(i);
              i++;

              if (i >= textToType.length) {
                i = 0
                clearInterval(intervalId);
                textToType = 'to free your trapped friends with a healthy meal before activating the portal and going back home!';

                intervalId = setInterval(() => {
                  textElement2.textContent += textToType.charAt(i);
                  i++;

                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    document.getElementById("rescuedContainer").style.display = 'block';
                    document.getElementById('click-start').style.display = 'block';
                    document.getElementById('loading-bar-container-3').style.display = 'none';
                    document.getElementById('loading-text-stage-3').style.display = 'none';
                    loading3nextButtonCounter = 0;
                    i = 0;
                    this.allowStart = true;
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed);

      }
    });

    retryStage3.addEventListener("click", () => {

      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      document.getElementById('final-score-bad-ending').classList.toggle('active');
      document.getElementById('badEndingUI').style.zIndex = 0;

      this.checkRestart = true;
      this.camera_.position.set(-10, 5, 0)
      this.allowPause = false;
      this.restartStage = false;
      this.gameOver_ = true;
      this.stageLoadCheck = false;
      if (this.player_.immunitiy) {
        this.player_.soundShield.pause();
        this.player_.soundShield.currentTime = 0;
      }
      this.player_.soundRunning.pause();
      pauseButton.style.display = 'none'
      document.getElementById("shieldTimer").style.zIndex = "-1";
      document.querySelector('#pauseDiv').style.display = 'none'
      document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("sheildHUD-blue").style.zIndex = "-1"
      document.getElementById("sheildHUD-green").style.zIndex = "-1"
      document.getElementById("sheildHUD-yellow").style.zIndex = "-1"

      document.getElementById("rescue1").src = "./resources/Rescued_Friend_UI/Friend1_notsaved.png"
      document.getElementById("rescue2").src = "./resources/Rescued_Friend_UI/Friend2_notsaved.png"
      document.getElementById("rescue3").src = "./resources/Rescued_Friend_UI/Friend3_notsaved.png"
      document.getElementById("rescue4").src = "./resources/Rescued_Friend_UI/Friend4_notsaved.png"
      document.getElementById("rescue5").src = "./resources/Rescued_Friend_UI/Friend5_notsaved.png"
      this.player_.friendsSaved = 0;

      document.querySelector('#video-container').style.background = ""
      document.getElementById('loading-button-container').style.display = 'block';

      this.playNextStageVideo3();
      this.eventAdded1 = false;
      this.countdown2_ = 6;
      this.startLoad2 = false;
      this.checkRestart = false;
      this.NotFirstTry = true;
      document.getElementById('loading3-next').style.display = 'none';
      document.getElementById('stage3-intro1').style.display = 'none'
      document.getElementById('stage3-intro2').style.display = 'none'
      document.getElementById('stage3-intro3').style.display = 'none'

      this.stopTime = true
      this.Pause()

    });

    continueEnding.addEventListener("click", () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      retryStage3.style.display = "none"
      continueEnding.style.display = "none"
      document.getElementById('stamina').style.display = "none";

      if (this.player_.friendsSaved == 5) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_3 of 3 complete.png"
      } else if (this.player_.friendsSaved >= 2) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_2 of 3 complete.png"
      } else if (this.player_.friendsSaved >= 1) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_1 of 3 complete.png"
      } else {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_0 of 3 complete.png"
      }
      document.getElementById('final-score').classList.toggle('active');
      document.getElementById('finalScoreUI').style.zIndex = 3;
      document.getElementById('badEndingUI').style.zIndex = 0;

    });

    finishEnding.addEventListener("click", () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      retryStage3.style.display = "none"
      finishEnding.style.display = "none"
      document.getElementById('stamina').style.display = "none";

      if (this.player_.friendsSaved == 4) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_3 of 3 complete.png"
      } else if (this.player_.friendsSaved >= 2) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_2 of 3 complete.png"
      } else if (this.player_.friendsSaved >= 1) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_1 of 3 complete.png"
      } else {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_0 of 3 complete.png"
      }
      document.getElementById('final-score').classList.toggle('active');
      document.getElementById('finalScoreUI').style.zIndex = 3;
      document.getElementById('goodEndingUI').style.zIndex = 0;

    });


    nextEnding.addEventListener("click", () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      document.getElementById("well-done-text").style.display = "none"
      document.getElementById("final-score-badges").style.display = "none"

      if (nextButtonCounter == 0) {
        nextButtonCounter = 1
        document.getElementById("final-score-recap-1").style.display = "block"
      } else {
        document.getElementById("final-score-recap-1").style.display = "none"

        document.getElementById("final-score-recap-2").style.display = "block"
        nextEnding.style.display = "none"
        nextRestart.style.display = "block"

      }

    });

    nextRestart.addEventListener("click", () => {
      location.reload();
    });


    // Add event listeners to the buttons
    restartButton.addEventListener("click", () => {
      this.stopTime = false
      this.RAF_()
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      this.restartStage = true;
    });

    // Add event listeners to the buttons
    continueButton.addEventListener("click", () => {
      if (this.allowPause) {
        var soundSelect = document.getElementById("sound-click");
        soundSelect.play();
        if (this.isPaused) {
          startPauseCountdown()
        }
      }
    });

    // Add event listeners to the buttons
    quitButton.addEventListener("click", () => {
      location.reload(true);

    });


    // Add event listeners to the buttons
    pauseButton.addEventListener("click", () => {
      if (this.allowPause) {
        var soundSelect = document.getElementById("sound-click");
        soundSelect.play();
        if (!this.isPaused) {
          startPause()
        }
      }
    });

    // Add event listeners to the buttons
    volumeButton.addEventListener("click", () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      const mediaElements = document.querySelectorAll('video, audio');
      // Loop through each element and set its volume to 0
      mediaElements.forEach(element => {
        element.volume = 0;
      });
      volumeButton.style.display = 'none'
      muteButton.style.display = 'block'
    });

    // Add event listeners to the buttons
    muteButton.addEventListener("click", () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      const mediaElements = document.querySelectorAll('video, audio');
      // Loop through each element and set its volume to 0
      mediaElements.forEach(element => {
        element.volume = 1;
      });
      volumeButton.style.display = 'block'
      muteButton.style.display = 'none'
    });


    //pop up

    window.addEventListener("load", () => {
      if (window.innerWidth < window.innerHeight) {
        // Portrait mode
        popup.style.display = "block";
        if (!this.stopTime) {
          if (this.allowPause) {
            if (!this.isPaused) {
              startPause()
            }
          }
        }
      } else {
        // Landscape mode
        popup.style.display = "none";

      }
    });

    window.addEventListener("orientationchange", () => {
      if (this.isMobileIOS() || this.isIpadOS()) {
        var popup = document.getElementById("popup");
        if (window.innerWidth < window.innerHeight) {
          // Portrait mode
          popup.style.display = "block";
          if (!this.stopTime) {
            if (this.allowPause) {
              if (!this.isPaused) {
                startPause()
              }
            }
          }
        } else {
          // Landscape mode
          popup.style.display = "none";

        }

      }
    });

    window.addEventListener("resize", () => {

      var popup = document.getElementById("popup");
      if (window.innerWidth < window.innerHeight) {
        // Portrait mode
        popup.style.display = "block";
        if (!this.stopTime) {
          if (this.allowPause) {
            if (!this.isPaused) {
              startPause()
            }
          }
        }
      } else {
        // Landscape mode
        popup.style.display = "none";

      }

    });

    //detect alt tabs
    window.addEventListener("visibilitychange", () => {
      if (!window.hidden) {

      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        if (this.allowPause && !this.pauseCountdownActive) {
          if (!this.isPaused) {
            startPause()
          }
        }
      }
    });


    //pause the game
    const startPause = () => {
      this.objSpeed = 0
      this.stopTime = true;
      this.isPaused = true;
      this.player_.soundRunning.volume = 0
      if (this.player_.immunitiy) {
        this.player_.soundShield.pause();
      }


      if (this.stage == 1) {
        this.stage1Music.pause()
      } else if (this.stage == 2) {
        this.stage2Music.pause()
      } else if (this.stage == 3) {
        this.stage3Music.pause()
      }
      document.querySelector('#pauseDiv').style.display = 'block'
      pauseButton.style.display = 'none'
      volumeButton.style.display = 'none'

    }

    //count down after unpause
    const startPauseCountdown = () => {
      this.pauseCountdownActive = true
      document.querySelector('#pauseDiv').style.display = 'none'
      document.getElementById('countdown').classList.toggle('active');
      this.intervalId_ = setInterval(() => {
        this.resumeCountdown_--;
        document.getElementById('power-countdown-text').textContent = this.resumeCountdown_;
        if (this.resumeCountdown_ === 0) {
          this.objSpeed = 0.2
          this.stopTime = false;
          this.RAF_()
          this.isPaused = false;
          this.player_.soundRunning.volume = 0
          if (this.player_.immunitiy) {
            this.player_.soundShield.play();
          }


          if (this.stage == 1) {
            this.stage1Music.play()
          } else if (this.stage == 2) {
            this.stage2Music.play()
          } else if (this.stage == 3) {
            this.stage3Music.play()
          }
          pauseButton.style.display = 'block'
          volumeButton.style.display = 'block'

          clearInterval(this.intervalId_);
          document.getElementById('countdown').classList.toggle('active');

          // Start another countdown
          document.getElementById('power-countdown-text').textContent = 3;
          this.resumeCountdown_ = 3;
          this.pauseCountdownActive = false



        }
      }, 1000)
    }



    //handle "click to continue" after game is won for IOS devices
    document.getElementById('click-end').addEventListener('click', () => {
      var soundSelect = document.getElementById("sound-click");
      soundSelect.play();
      this.player_.soundRunning.volume = 0.5

      if (this.stage == 2) {
        document.getElementById('click-end').style.display = 'none';
        this.playNextStageVideo2()
      } else if (this.stage == 3) {
        document.getElementById('click-end').style.display = 'none';
        this.playNextStageVideo3()
      } else if (this.stage == 4) {
        document.getElementById('click-end').style.display = 'none';
        if (this.player_.friendsSaved == 5) {
          this.playVictoryVid()
        } else {
          pauseButton.style.display = 'none'
          while (this.scene_.children.length > 0) {
            this.scene_.remove(this.scene_.children[0]);
          }
          this.NotFirstTry = false;

          this.stopTime = true
          this.Pause()
          document.getElementById('loading3-next').style.display = 'none';

          // document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;
          document.getElementById("volume-container").style.display = 'none';
          document.getElementById('final-score-bad-ending').classList.toggle('active');
          document.getElementById('badEndingUI').style.zIndex = 3;

          if (this.gender_ == "male") {
            document.getElementById('boyHUD').style.display = 'none'
          } else if (this.gender_ == "female") {
            document.getElementById('girlHUD').style.display = 'none'
          }
        }
      }

    });

    //handle "click to continue" after video has ended and stage has loaded
    document.getElementById('click-start').addEventListener('click', () => {
      this.player_.soundRunning.play();
      this.player_.soundRunning.volume = 0.5
      var soundAgentBgm = document.getElementById("sound-agentBgm");
      soundAgentBgm.pause();
      if (this.startstage) {
        var soundBeefteki = document.getElementById("sound-beeftekiIntro2");
        soundBeefteki.play();
        if (this.stage == 1) {
          this.stage1Music.play()
          document.getElementById('loading-button-container').style.display = 'none';
          document.getElementById('loading-1').style.display = 'none';
        } else if (this.stage == 2) {
          this.stage2Music.play()
          this.RAF_();
          document.getElementById('loading-2').style.display = 'none';
          document.getElementById('loading-button-container').style.display = 'none';
        } else if (this.stage == 3) {
          this.stage3Music.play()
          this.RAF_();
          document.getElementById('loading-3').style.display = 'none';
          document.getElementById('loading-button-container').style.display = 'none';
        }
        this.stopTime = false;
        this.objSpeed = 0.2
        this.isPaused = false;
        this.startstage = false;
        this.allowPause = true;
        pauseButton.style.display = 'block'
        this.player_.position_.z = 0
        document.getElementById('click-start').style.display = 'none';

      } else if (this.startGame && !this.checkStartGame) {
        var soundBeefteki = document.getElementById("sound-beeftekiIntro1");
        soundBeefteki.play();

        this.stopTime = false;
        this.firstloadload = true;
        this.RAF_()
        this.checkStartGame = true;
        this._OnStart()
        this.allowPause = true;
        document.getElementById('stage1-intro1').style.display = 'none'
        document.getElementById('stage1-intro2').style.display = 'none'
        document.getElementById('stage1-intro3').style.display = 'none'
        document.getElementById('loading-1').style.display = 'none';
        document.getElementById('click-start').style.display = 'none';

      }

    });

    document.addEventListener('stage2loaded', () => {
      var textElement = document.getElementById('stage2-intro1-text1');
      var textElement1 = document.getElementById('stage2-intro1-text2');
      var textElement2 = document.getElementById('stage2-intro1-text3');
      var textElement3 = document.getElementById('stage2-intro1-text4');
      textElement.textContent = '';
      textElement1.textContent = '';
      textElement2.textContent = '';
      textElement3.textContent = '';

      var soundAgent = document.getElementById("sound-agent4");
      soundAgent.play();

      var textToType = "• Remember water is always the best choice so avoid sweetened beverages! ";
      var typingSpeed = 10;
      var i = 0;
      var intervalId = setInterval(() => {
        textElement.textContent += textToType.charAt(i);
        i++;
        if (i >= textToType.length) {
          i = 0
          clearInterval(intervalId);
          textToType = "• Fill your water bottles up from school water coolers "
          intervalId = setInterval(() => {
            textElement1.textContent += textToType.charAt(i);
            i++;
            if (i >= textToType.length) {
              i = 0

              clearInterval(intervalId);
              textToType = "• If you are purchasing drinks, choose beverages which have been graded A or B only. ";
              intervalId = setInterval(() => {
                textElement2.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  clearInterval(intervalId);
                  i = 0
                  textToType = "• Hydrate yourself with at least 8 glasses every day!";
                  intervalId = setInterval(() => {
                    textElement3.textContent += textToType.charAt(i);
                    i++;
                    if (i >= textToType.length) {
                      clearInterval(intervalId);
                      document.getElementById('loading2-next').style.display = 'block';
                    }
                  }, typingSpeed);
                }
              }, typingSpeed);
            }
          }, typingSpeed);
        }
      }, typingSpeed);
    })

    document.addEventListener('stage3loaded', () => {

      var textElement = document.getElementById('stage3-intro1-text1');
      var textElement1 = document.getElementById('stage3-intro1-text2');
      var textElement2 = document.getElementById('stage3-intro1-text3');
      var textElement3 = document.getElementById('stage3-intro1-text4');

      textElement.textContent = '';
      textElement1.textContent = '';
      textElement2.textContent = '';
      textElement3.textContent = '';

      var soundAgent = document.getElementById("sound-agent7");
      soundAgent.play();
      var textToType = "• Fill your plate with Quarter-Quarter Half; wholegrains, meat & others, fruit and vegetables.";
      var typingSpeed = 10;
      var i = 0;
      var intervalId = setInterval(function () {
        textElement.textContent += textToType.charAt(i);
        i++;
        if (i >= textToType.length) {
          i = 0
          clearInterval(intervalId);
          textToType = "• Go for 2 servings of fruit and 2 servings of vegetables every day!";
          intervalId = setInterval(function () {
            textElement1.textContent += textToType.charAt(i);
            i++;
            if (i >= textToType.length) {
              i = 0
              clearInterval(intervalId);
              textToType = "• Choose fresh over processed or preserved food and avoid fried food.";
              intervalId = setInterval(function () {
                textElement2.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  i = 0
                  clearInterval(intervalId);
                  textToType = "• Take time to chew your food when eating and avoid any distractions like screen time. This allows for your food to digest better.";
                  intervalId = setInterval(function () {
                    textElement3.textContent += textToType.charAt(i);
                    i++;
                    if (i >= textToType.length) {
                      i = 0
                      clearInterval(intervalId);
                      document.getElementById('loading3-next').style.display = 'block';
                    }
                  }, typingSpeed);
                }
              }, typingSpeed);
            }
          }, typingSpeed);
        }
      }, typingSpeed);
    })


    document.addEventListener('keydown', () => {
      if (this.allowStart) {

        if (this.stopTime == false) {
          this.player_.soundRunning.play();
          this.player_.soundRunning.volume = 0.5;
          var soundAgentBgm = document.getElementById("sound-agentBgm");
          soundAgentBgm.pause();
        }



        if (this.startstage) {
          if (this.stage == 1) {
            this.stage1Music.play()
            document.getElementById('loading-button-container').style.display = 'none';
            document.getElementById('loading-1').style.display = 'none';
          } else if (this.stage == 2) {
            this.stage2Music.play()
            this.RAF_();
            document.getElementById('loading-2').style.display = 'none';
            document.getElementById('loading-button-container').style.display = 'none';
          } else if (this.stage == 3) {
            this.stage3Music.play()
            this.RAF_();
            document.getElementById('loading-3').style.display = 'none';
            document.getElementById('loading-button-container').style.display = 'none';
          }
          this.stopTime = false;
          this.objSpeed = 0.2
          this.isPaused = false;
          this.startstage = false;
          this.allowPause = true;
          pauseButton.style.display = 'block'
          this.player_.position_.z = 0
          document.getElementById('click-start').style.display = 'none';
          this.allowStart = false;
        } else if (this.startGame && !this.checkStartGame) {
          this.stopTime = false;
          this.RAF_()
          this.checkStartGame = true;
          this._OnStart()
          this.allowPause = true;
          document.getElementById('stage1-intro1').style.display = 'none'
          document.getElementById('stage1-intro2').style.display = 'none'
          document.getElementById('stage1-intro3').style.display = 'none'
          document.getElementById('loading-1').style.display = 'none';
          document.getElementById('click-start').style.display = 'none';
          this.allowStart = false;
        }
      }
    });


    // set random positoin for drinks
    let arrDrinks1 = [0, 3, -3, 3, -3, 0, 0, 0, 0, -3, -3, -3, -3, -3, -3, 3, -3, 3, -3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, -3, -3]
    let arrDrinks2 = [0, -3, -3, 0, 3, 0];
    let arrDrinks3 = [3, 3, 0, -3, -3, 3];


    // set random positoin for box logos
    let arrLogo1 = [];
    let arrLogo2 = [];
    let arrLogo3 = [];

    for (let i = 0; i < 5; i++) {
      let value1 = Math.floor(Math.random() * 3) - 1;
      let value2 = Math.floor(Math.random() * 3) - 1;
      let value3 = Math.floor(Math.random() * 3) - 1;

      while (value1 === value2) {
        value2 = Math.floor(Math.random() * 3) - 1;
      }

      while (value1 === value3 || value2 === value3) {
        value3 = Math.floor(Math.random() * 3) - 1;
      }

      arrLogo1.push(value1 * 3);
      arrLogo2.push(value2 * 3);
      arrLogo3.push(value3 * 3);
    }

    //set random position for food
    let food1 = [];
    let food2 = [];
    let food3 = [];

    for (let i = 0; i < 4; i++) {
      let value1 = Math.floor(Math.random() * 3) - 1;
      let value2 = Math.floor(Math.random() * 3) - 1;
      let value3 = Math.floor(Math.random() * 3) - 1;

      while (value1 === value2) {
        value2 = Math.floor(Math.random() * 3) - 1;
      }

      while (value1 === value3 || value2 === value3) {
        value3 = Math.floor(Math.random() * 3) - 1;
      }

      food1.push(value1 * 3);
      food2.push(value2 * 3);
      food3.push(value3 * 3);
    }

    const animate = (timestamp) => {
      const deltaTime = timestamp - previousTimestamp;
      const targetDeltaTime = 1000 / 60; // Target time for 60 FPS in milliseconds

      // Adjust the speed based on the deltaTime
      this.speed = this.objSpeed * (deltaTime / targetDeltaTime);
      if (this._gameStarted && !this.stopTime) {
        this.Step_(this.speed, this.isPaused);

      }

      previousTimestamp = timestamp;
      this.animationId = requestAnimationFrame(animate);
      this.threejs_.render(this.scene_, this.camera_);

    };

    let previousTimestamp = 0;
    animate();


    //initiate all the game objects
    this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_, stage: this.stage });
    this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_, stage: this.stage });
    this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, firstChase: this.showChase, stage: this.stage });
    this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });
    this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
    this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
    this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase, stage: this.stage });
    this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase, stage: this.stage });
    this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase, stage: this.stage });
    this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase, stage: this.stage });
    this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 });
    this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 });
    this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 });
    this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 });
    this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 });
    this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 });
    this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage, firstChase: this.showChase });
    this.progression_ = new progression.ProgressionManager({ fail: false });

    //final variables 
    this.gameOver_ = false;
    this.previousRAF_ = null;
    this.RAF_();
    this.OnWindowResize_();
  }

  //pause all moving objects
  Pause() {
    this.objSpeed = 0
    this.isPaused = true;
    this.player_.soundRunning.volume = 0

  }


  shakeCamera() {
    clearInterval(this.shakeInterval); // Clear any existing shake interval
    this.shakeTime = 0; // Reset the shake time
    this.shakeInterval = setInterval(() => {
      this.shakeTime += 0.01; // Increase the shake time by a small amount
      var shakeX = (Math.sin(this.shakeTime * 50) * this.shakeIntensity) - 10; // Calculate the X displacement
      var shakeY = (Math.sin(this.shakeTime * 80) * this.shakeIntensity) + 5; // Calculate the Y displacement
      this.camera_.position.set(shakeX, shakeY, 0); // Apply the displacement to the camera position
      if (this.shakeTime >= this.shakeDuration) { // Stop the shake effect after the duration has elapsed
        clearInterval(this.shakeInterval);
        this.camera_.position.set(-10, 5, 0); // Reset the camera position
        this.player_.playerHit = false;
        this.checkHit = false;

      }
    }, 20);
  }

  //handle window resize to maintain aspect ratio
  OnWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  //start the animation 
  RAF_() {
    if (!this.firstloadload) {
      let time;
      requestAnimationFrame((t) => {
        if (!this.stopTime) {
          if (this.previousRAF_ === null) {
            this.previousRAF_ = t;
          }
          if ((t - this.previousRAF_ > 200)) {
            this.previousRAF_ = t
          }

          time = t - this.previousRAF_
          this.RAF_();
          this.Step_((time / 16.6 * time) / 1000.0, this.isPaused);


          this.threejs_.render(this.scene_, this.camera_);
          this.previousRAF_ = t;
        }

      });
    }
  }

  //what the animation does

  Step_(timeElapsed, pause) {

    //MAP MOVEMENT
    if (this._gameStarted && !this.manDead && !this.isPaused) {
      this.mesh.position.x -= timeElapsed
      this.mesh1.position.x -= timeElapsed
      this.mesh2.position.x -= timeElapsed
      this.mesh3.position.x -= timeElapsed
      if (this.mesh4) {
        this.mesh4.position.x -= timeElapsed
      }
      if (this.mesh5) {
        this.mesh5.position.x -= timeElapsed
      }
      if (this.mesh6) {
        this.mesh6.position.x -= timeElapsed
      }
    }

    //pan the camera
    if (this.showChase && this._gameStarted) {

      if (!this.setCameraChase) {
        this.cameraX = 15;
        this.cameraY = 5.5;
        this.cameraZ = -10;
        this.setCameraChase = true;
      }

      if (this.cameraX > -10) {
        this.cameraX = this.cameraX - (timeElapsed / 2)
      }
      if (this.cameraY > 5) {
        this.cameraY = this.cameraY - (timeElapsed / 10)

      }
      if (this.cameraZ < 0) {
        this.cameraZ = this.cameraZ + (timeElapsed / 5)
      }

      if (this.cameraZ > -3) {
        this.oilSlik_.mesh_.scale.set(0.25, 0.25, 0.25)
      }

      if (this.cameraX <= -10 && this.cameraY <= 5 && this.cameraZ >= 0) {
        pauseButton.style.display = 'block'
        this.showChase = false;
      }
      this.camera_.lookAt(0, 2, 0)

      this.camera_.position.set(this.cameraX, this.cameraY, this.cameraZ);

    }

    //if he loses stage 1
    if (!this.eventAdded3 && this.stage == 1) {
      document.addEventListener('score-over', () => {

        this.nextStageVideo1_.addEventListener("ended", () => {
          this.allowStart = false;
          this.showChase = false;
          this.gameOver_ = true;
          this.failedStage = false;
          this.allowPause = false;
          this.stopTime = true
          this.player_.soundRunning.pause();

          this.Pause()


          if (this.scene_.children.length === 0 && !this.stageLoadCheck) {
            this.stageLoadCheck = true;

            // set randon positoin for drinks
            let arrDrinks1 = [0, 3, -3, 3, -3, 0, 0, 0, 0, -3, -3, -3, -3, -3, -3, 3, -3, 3, -3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, -3, -3]
            let arrDrinks2 = [0, -3, -3, 0, 3, 0];
            let arrDrinks3 = [3, 3, 0, -3, -3, 3];

            //initiate all the game objects
            this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, firstChase: this.showChase, stage: this.stage });
            this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
            this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
            this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase, stage: this.stage });
            this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase, stage: this.stage });
            this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase, stage: this.stage });
            this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase, stage: this.stage });
            this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage, firstChase: this.showChase });
            this.progression_ = new progression.ProgressionManager({ fail: true });
            this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });


            let light = new THREE.DirectionalLight(0xffffff, 1);

            this.scene_.add(light);

            light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
            this.scene_.add(light);

            light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
            light.position.set(-7, 20, 0);
            this.scene_.add(light);


            //load map
            const loader = new GLTFLoader();
            loader.setPath('./resources/Map/Stage1/');
            loader.load('stg1_A.gltf', (gltf) => {
              this.mesh = gltf.scene;
              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh.position.set(83, 0, 0);
              this.mesh.rotation.set(0, -Math.PI / 2, 0);
              this.mesh.scale.setScalar(0.01);
              this.scene_.add(this.mesh);

            });
            loader.load('stg1_B.gltf', (gltf) => {
              this.mesh1 = gltf.scene;
              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh1.position.set(292, -0.1, 0);
              this.mesh1.rotation.set(0, -Math.PI / 2, 0);
              this.mesh1.scale.setScalar(0.01);

              this.scene_.add(this.mesh1);
            });
            loader.load('stg1_exit.gltf', (gltf) => {
              this.mesh2 = gltf.scene;
              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh2.position.set(500, 0, 0);
              this.mesh2.rotation.set(0, -Math.PI / 2, 0);
              this.mesh2.scale.setScalar(0.01);

              this.scene_.add(this.mesh2);
            });


            const uniforms = {
              topColor: { value: new THREE.Color(0xFCF7E2) },
              bottomColor: { value: new THREE.Color(0xCFE9E0) },
              offset: { value: 33 },
              exponent: { value: 0.6 }
            };

            const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
            const skyMat = new THREE.ShaderMaterial({
              uniforms: uniforms,
              vertexShader: _VS,
              fragmentShader: _FS,
              side: THREE.BackSide,
            });
            this.scene_.add(new THREE.Mesh(skyGeo, skyMat));

            this.gameOver_ = false;
            this.stopTime = false;
            this.RAF_();
          }
          const progressBar = document.getElementById('loading-bar-stage-1');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 106) {
              console.log(this.scene_.children.length)
              const progressPercentage = (loadingProgress / 106) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.previousRAF_ = null;
              this.startstage = true;
              this.Pause();
              clearInterval(this.intervalId_);
              if (this.NotFirstTry) {
                this.allowStart = true;
              }

              // text type writer 
              var textElement = document.getElementById('stage1-intro1-text1');
              var textElement1 = document.getElementById('stage1-intro1-text2');
              var textElement2 = document.getElementById('stage1-intro1-text3');

              var soundAgent = document.getElementById("sound-agent1");
              soundAgent.play();

              var textToType = "• Hi, my name is SOFIA and I'm here to help. ";
              var typingSpeed = 10;
              var i = 0;
              var intervalId = setInterval(function () {
                textElement.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  i = 0
                  clearInterval(intervalId);
                  textToType = "BEEFTEKI";
                  intervalId = setInterval(function () {
                    textElement1.textContent += textToType.charAt(i);
                    i++;
                    if (i >= textToType.length) {
                      i = 0

                      clearInterval(intervalId);
                      textToType = "is after you - avoid him!";
                      intervalId = setInterval(function () {
                        textElement2.textContent += textToType.charAt(i);
                        i++;
                        if (i >= textToType.length) {
                          clearInterval(intervalId);
                          document.getElementById('loading1-next').style.display = 'block';
                        }
                      }, typingSpeed);
                    }
                  }, typingSpeed);
                }
              }, typingSpeed);

              document.getElementById('loading-bar-container').style.display = 'none';
              document.getElementById('loading-text-stage-1').style.display = 'none';
              document.getElementById('click-start').style.display = 'block';
            }

          }, 200);
        })
      })
      this.eventAdded3 = true;
    }

    //stage 1 won
    if (!this.eventAdded && this.stage == 1) {

      document.addEventListener('score-over1', () => {
        this.allowStart = false;
        this.stage1Music.pause()
        this.stage1Music.currentTime = 0;
        this.player_.soundRunning.pause();
        if (this.player_.immunitiy) {
          this.player_.soundShield.pause();
          this.player_.soundShield.currentTime = 0;

        }
        this.showChase = false;
        this.gameOver_ = true;
        this.failedStage = false;
        this.stageLoadCheck = false;
        this.allowPause = false;
        this.stopTime = true
        this.Pause()
        this.stage = 2;

        document.getElementById('sheildHUD-container').style.display = 'block';

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
          document.getElementById('click-end').style.display = 'block';
        } else {
          this.playNextStageVideo2()
        }

        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });

        this.nextStageVideo2_.addEventListener("ended", () => {

          if (this.scene_.children.length === 0 && !this.stageLoadCheck) {
            this.stageLoadCheck = true;
            // set randon positoin for drinks
            let arrDrinks1 = [0, 0, 0, -3, 3, 3, -3, -3, 3, -3, 3, -3, 3, 0, 3, -3, 0, -3, -3, 0, 3, 0, -3, 3, 0, -3, 0, 3, 3, 0, -3, 3, -3, 3, 0, 0];
            let arrDrinks2 = [-3, 0, 3, 0];
            let arrDrinks3 = [3, 0, 3, -3];

            // set randonm position for food
            let food1 = [-3, -3, 0, -3, 3, -3, 3, 0, -3, 0, 3, 0, -3, 3, -3, 0];
            let food2 = [0, 3, 3, 0, 0, 0, -3, 3, 3, -3, 0, 3, -3, 0, 3, -3]
            let food3 = [3, 0, -3, 0, -3, 3, -3, 0, 3, -3, 0, 3, -3, 0, 3];

            for (let i = 0; i < 6; i++) {
              let value1 = Math.floor(Math.random() * 3) - 1;
              let value2 = Math.floor(Math.random() * 3) - 1;
              let value3 = Math.floor(Math.random() * 3) - 1;

              while (value1 === value2) {
                value2 = Math.floor(Math.random() * 3) - 1;
              }

              while (value1 === value3 || value2 === value3) {
                value3 = Math.floor(Math.random() * 3) - 1;
              }

              food1.push(value1 * 3);
              food2.push(value2 * 3);
              food3.push(value3 * 3);
            }


            //initiate all the game objects
            this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_, stage: this.stage });
            this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_, stage: this.stage });
            this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, stage: this.stage });
            this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
            this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
            this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase, stage: this.stage });
            this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase, stage: this.stage });
            this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase, stage: this.stage });
            this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase, stage: this.stage });
            this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1, stage: this.stage })
            this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2, stage: this.stage })
            this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3, stage: this.stage })
            this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
            this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage });
            this.progression_ = new progression.ProgressionManager({ fail: false });

            let light = new THREE.DirectionalLight(0xffffff, 1);
            this.scene_.add(light);

            light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
            this.scene_.add(light);

            light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
            light.position.set(-7, 20, 0);
            this.scene_.add(light);

            this.scene_.background = new THREE.Color(0x808080);
            this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

            const loader = new GLTFLoader();
            loader.setPath('./resources/Map/Stage2/');
            loader.load('stg2_A.gltf', (gltf) => {
              this.mesh = gltf.scene;

              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh.position.set(-5, 0, 0);
              this.mesh.rotation.set(0, -Math.PI / 2, 0);
              this.mesh.scale.setScalar(0.01);

              this.scene_.add(this.mesh);
            });
            loader.load('stg2_A.gltf', (gltf) => {
              this.mesh1 = gltf.scene;

              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh1.position.set(205.2, 0, 0);
              this.mesh1.rotation.set(0, -Math.PI / 2, 0);
              this.mesh1.scale.setScalar(0.01);

              this.scene_.add(this.mesh1);
            });
            loader.load('stg2_B.gltf', (gltf) => {
              this.mesh2 = gltf.scene;

              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh2.position.set(415, 0, 0);
              this.mesh2.rotation.set(0, -Math.PI / 2, 0);
              this.mesh2.scale.setScalar(0.01);

              this.scene_.add(this.mesh2);
            });
            loader.load('stg2_C.gltf', (gltf) => {
              this.mesh3 = gltf.scene;

              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh3.position.set(625, 0, 0);
              this.mesh3.rotation.set(0, -Math.PI / 2, 0);
              this.mesh3.scale.setScalar(0.01);

              this.scene_.add(this.mesh3);
            });
            loader.load('stg2_exit.gltf', (gltf) => {
              this.mesh4 = gltf.scene;

              gltf.castShadow = true;
              gltf.receiveShadow = true;
              this.mesh4.position.set(727, 0, 0);
              this.mesh4.rotation.set(0, -Math.PI / 2, 0);
              this.mesh4.scale.setScalar(0.01);

              this.scene_.add(this.mesh4);
            });

            this.gameOver_ = false;
            this.stopTime = false;
            this.RAF_();
          }


          const progressBar = document.getElementById('loading-bar-stage-2');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 164) {
              console.log(this.scene_.children.length)
              const progressPercentage = (loadingProgress / 164) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.stopTime = true
              this.previousRAF_ = null;
              this.startstage = true;
              this.player_.propArray = []
              this.Pause();
              // clearInterval(this.intervalId_);

              if (this.NotFirstTry) {
                this.allowStart = true;
                document.getElementById('loading-bar-container-2').style.display = 'none';
                document.getElementById('loading-text-stage-2').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
              }

              if (!this.startLoad1) {
                document.dispatchEvent(new CustomEvent('stage2loaded'));
                this.startLoad1 = true;
              }

            }

          }, 100);

        })

      });
      this.eventAdded = true;

    }

    //stage 2 won
    if (!this.eventAdded1 && this.stage == 2) {

      document.addEventListener('score-over2', () => {
        this.allowStart = false;
        this.stage2Music.pause()
        this.stage2Music.currentTime = 0;
        document.getElementById("shieldTimer").style.zIndex = "-1";
        this.player_.soundRunning.pause();
        if (this.player_.immunitiy) {
          this.player_.soundShield.pause();
          this.player_.soundShield.currentTime = 0;
        }
        this.gameOver_ = true;
        this.failedStage = false;
        this.stopTime = true
        this.allowPause = false;
        this.stageLoadCheck = false;

        this.Pause()
        pauseButton.style.display = 'none'
        document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        this.stage = 3;

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
          document.getElementById('click-end').style.display = 'block';
        } else {
          this.playNextStageVideo3()
        }

        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });

        this.nextStageVideo3_.addEventListener("ended", () => {
          this.intervalId_ = setInterval(() => {
            this.countdown2_--;
            if (this.scene_.children.length === 0 && !this.stageLoadCheck) {
              this.stageLoadCheck = true;

              // set randon position for drinks
              let arrDrinks1 = [-3, 0, 0, -3, 0, 3, 3, 3, -3, -3, 0, 3, -3, -3, 0, 3, 0, 0, 0, 0, -3, 3, -3, 3, 0];

              // set randonm positoin for box logos
              let arrLogo1 = [0, 3, 3, 0, -3];
              let arrLogo2 = [3, 0, 0, -3, 0];
              let arrLogo3 = [-3, -3, -3, 3, 3];

              // set randonm position for food
              let food1 = [0, 3, 0, -3, 0, 3, 0, 3, 0, 3, 3, 3];
              let food2 = [3, -3, 0, -3, 0, -3, -3, 3, -3, 3, -3, 0, 0];
              let food3 = [-3, 0, 3, -3, 0, -3, 3, -3, 3, 0, -3, 0, -3, 0, 0, -3];

              //initiate all the game objects
              this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_, stage: this.stage });
              this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_, stage: this.stage });
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, stage: this.stage });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
              this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase, stage: this.stage });
              this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 })
              this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 })
              this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 })
              this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1, stage: this.stage })
              this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2, stage: this.stage })
              this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3, stage: this.stage })
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage });
              this.sky_ = new sky.Sky({ scene: this.scene_ });

              this.progression_ = new progression.ProgressionManager({ fail: false });
              this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });

              let light = new THREE.DirectionalLight(0xffffff, 1);

              this.scene_.add(light);

              light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
              this.scene_.add(light);

              light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
              light.position.set(-7, 20, 0);
              this.scene_.add(light);

              this.scene_.background = new THREE.Color(0x3C6090);
              // this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

              const loader = new GLTFLoader();
              loader.setPath('./resources/Map/Stage3/');
              loader.load('stg3_Start.gltf', (gltf) => {
                this.mesh = gltf.scene;

                this.mesh.position.set(110, 0, 0);
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                this.mesh.scale.setScalar(0.01);


                this.scene_.add(this.mesh);

              });
              loader.load('stg3_C.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                this.mesh1.position.set(223, -0.2, 0);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                this.mesh1.scale.setScalar(0.01);


                this.scene_.add(this.mesh1);

              });
              loader.load('stg3_D.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                this.mesh2.position.set(346, 0, 0);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                this.mesh2.scale.setScalar(0.01);


                this.scene_.add(this.mesh2);

              });
              loader.load('stg3_B.gltf', (gltf) => {
                this.mesh3 = gltf.scene;

                this.mesh3.position.set(551, -0.2, 0);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0);
                this.mesh3.scale.setScalar(0.01);


                this.scene_.add(this.mesh3);

              });
              loader.load('stg3_D.gltf', (gltf) => {
                this.mesh4 = gltf.scene;

                this.mesh4.position.set(750, 0, 0);
                this.mesh4.rotation.set(0, -Math.PI / 2, 0);
                this.mesh4.scale.setScalar(0.01);


                this.scene_.add(this.mesh4);

              });
              loader.load('stg3_A.gltf', (gltf) => {
                this.mesh5 = gltf.scene.children[0];

                this.mesh5.position.set(955, -0.2, 0);
                this.mesh5.rotation.set(0, -Math.PI / 2, 0);
                this.mesh5.scale.setScalar(0.01);

                this.scene_.add(this.mesh5);
              });

              loader.load('st3_exit.gltf', (gltf) => {
                this.mesh6 = gltf.scene.children[0];

                this.mesh6.position.set(1032, 11.5, 5.5);
                this.mesh6.rotation.set(0, -Math.PI / 2, 0);
                this.mesh6.scale.setScalar(0.01);

                this.scene_.add(this.mesh6);
              });

              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown2_ === 0) {
              if (this.scene_.children.length < 65) {
                this.countdown2_ = 3
              }
            }
          }, 1000);


          const progressBar = document.getElementById('loading-bar-stage-3');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 120) {
              console.log(this.scene_.children.length)

              // Calculate the loading progress as a percentage of the maximum value
              const progressPercentage = (loadingProgress / 120) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.stopTime = true;
              this.previousRAF_ = null;
              this.startstage = true;
              this.Pause();
              this.player_.propArray = []
              if (this.NotFirstTry) {
                this.allowStart = true;
                document.getElementById('loading-bar-container-3').style.display = 'none';
                document.getElementById('loading-text-stage-3').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
              }
              clearInterval(this.intervalId_);
              if (!this.startLoad2) {
                document.dispatchEvent(new CustomEvent('stage3loaded'));
                this.startLoad2 = true;
              }
            }

          }, 50);


        })
      });
      this.eventAdded1 = true;

    }


    //if player wins stage 3
    if (!this.eventAdded2 && this.stage == 3) {
      document.addEventListener('score-over3', () => {
        this.stage3Music.pause()
        this.stage3Music.currentTime = 0;
        this.player_.soundRunning.pause();
        if (this.player_.immunitiy) {
          this.player_.soundShield.pause();
          this.player_.soundShield.currentTime = 0;
        }
        this.allowPause = false;
        this.gameOver_ = true;
        this.stopTime = true;
        pauseButton.style.display = 'none'
        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
          document.getElementById('click-end').style.display = 'block';
        } else {
          if (this.player_.friendsSaved == 5) {
            this.playVictoryVid()
          } else {
            pauseButton.style.display = 'none'
            while (this.scene_.children.length > 0) {
              this.scene_.remove(this.scene_.children[0]);
            }
            this.NotFirstTry = false;

            this.stopTime = true
            this.Pause()
            document.getElementById('loading3-next').style.display = 'none';

            // document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;
            document.getElementById("volume-container").style.display = 'none';
            document.getElementById('final-score-bad-ending').classList.toggle('active');
            document.getElementById('badEndingUI').style.zIndex = 3;

          }
        }


      });
      this.eventAdded2 = true;
    }


    if (this._gameStarted) {
      //load the game assets and animations
      if (this.stage == 1) {
        this.water_.Update(timeElapsed)
        this.waterGrade_.Update(timeElapsed)
        this.fruitDrinkGrade_.Update(timeElapsed)
        this.sodaGrade_.Update(timeElapsed)
        this.soda_.Update(timeElapsed)
        this.fruitDrink_.Update(timeElapsed)
        this.pitfall_.Update(timeElapsed)
      } else if (this.stage == 2) {
        console.log(this.manDead)
        if (!this.manDead) {
          console.log("play")
          this.water_.Update(timeElapsed)
          this.waterGrade_.Update(timeElapsed)
          this.fruitDrinkGrade_.Update(timeElapsed)
          this.sodaGrade_.Update(timeElapsed)
          this.soda_.Update(timeElapsed)
          this.fruitDrink_.Update(timeElapsed)
          this.pitfall_.Update(timeElapsed)
          this.vege_.Update(timeElapsed)
          this.meat_.Update(timeElapsed)
          this.carbs_.Update(timeElapsed)
        }
        this.shoogaGlider_.Update(timeElapsed);
        this.trolliumChloride_.Update(timeElapsed, this.manDead)
      } else if (this.stage == 3) {
        this.wallrun_.Update(timeElapsed)
        this.waterGrade_.Update(timeElapsed)
        this.hpbLogo_.Update(timeElapsed)
        this.hpbWrongLogo1_.Update(timeElapsed)
        this.hpbWrongLogo2_.Update(timeElapsed)
        this.water_.Update(timeElapsed)
        this.pitfall_.Update(timeElapsed)
        this.shoogaGlider_.Update(timeElapsed);
        this.vege_.Update(timeElapsed)
        this.meat_.Update(timeElapsed)
        this.carbs_.Update(timeElapsed)
        this.sky_.Update();
        this.trolliumChloride_.Update(timeElapsed)

        //get position of wall from wallrun.js
        this.wallrun_.GetPosition(result => {
          this.wallPosition = result
        });
      }



      this.player_.Update(timeElapsed, pause, this.wallPosition, this.swipeLeft, this.swipeRight, this.showChase);
      this.oilSlik_.Update(timeElapsed, pause, this.showChase);
      this.progression_.Update(timeElapsed, pause, this.stage, this.gameOver_, this.buffspeed, this.stage1lose);


      //if player gets hit bruh 
      if (this.player_.playerHit == true && !this.checkHit) {
        this.checkHit = true;
        this.shakeCamera()
      }
      this.player_.getSpeed(result => {
        this.speed_ = result
        //if speed is not default, meaning the player has a speed buff/debuff
        if (this.speed_ != 0.2 && !pause) {
          this.objSpeed = 0.2 * (this.speed_ / 0.2)
          this.buffspeed = true;

        } else {
          this.buffspeed = false;

        }
      });

      //check if player collides with the pit
      this.player_.getPitCollide(result => {
        setTimeout(() => {
          if (result) {
            console.log("Hi")

            this.Pause()
            this.player_.position_.y = this.player_.position_.y - timeElapsed * 2
          }
        }, 100);

      });

      //check if player runs out of stamina
      this.player_.getCollapse(result => {
        setTimeout(() => {

          if (result && !this.collapsed) {
            if (this.player_.position_.y > 0) {
              this.player_.position_.y = this.player_.position_.y - timeElapsed * 3
            }
            if (this.player_.position_.x < 3) {
              this.player_.position_.x = this.player_.position_.x + timeElapsed * 3
            }
            this.progression_.progress_ += timeElapsed;

            const scoreText1 = (Math.round((this.progression_.progress_ * 10) / 10)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 60;

            document.getElementById('monster').style.left = scoreText1 + 'vw';

            this.isPaused = true;
            this.manDead = true;
            if (this.oilSlik_.mesh_.position.x < 0) {
              this.oilSlik_.mesh_.position.x += timeElapsed
              this.oilSlik_.mesh_.scale.set(0.3, 0.3, 0.3)
            } else {
              this.collapsed = true;

            }
          }
        }, 100);

      });

      //check if player fails wall jump
      if (this.player_.wallFail) {
        setTimeout(() => {
          this.Pause()
          this.player_.position_.y = this.player_.position_.y - timeElapsed * 6
        }, 200);
      }


      //checks for swipe gestures
      if (!this.player_.collapse && !this.player_.pitCollide && !this.player_.wallFail) {

        // if (this.swipeLeft) {
        //   if (!this.player_.onWall) {
        //     this.player_.keys_.left = true;
        //     this.isSwiping = true
        //   }

        //   if (this.player_.onWall) {
        //     if (this.player_.position_.z <= -3) {
        //       this.swipeLeft = false;
        //       this.isSwiping = false;
        //     }
        //   } else {
        //     if (this.player_.position_.z <= -3 || this.player_.position_.z <= 0) {
        //       this.swipeLeft = false;
        //       this.isSwiping = false;
        //     }
        //   }
        // }
        // if (this.swipeRight) {
        //   if (!this.player_.onWall) {
        //     this.player_.keys_.right = true;
        //     this.isSwiping = true
        //   }
        //   if (this.player_.onWall) {
        //     if (this.player_.position_.z >= 3) {
        //       this.swipeRight = false;
        //       this.isSwiping = false;
        //     }
        //   } else {
        //     if (this.player_.position_.z >= 3 || this.player_.position_.z >= 0) {
        //       this.swipeRight = false;
        //       this.isSwiping = false;
        //     }
        //   }
        // }
        if (this.swipeUp && !this.swipeDown) {
          this.player_.SwipeUp(timeElapsed);
          this.swipeUp = false;

        }
        if (this.swipeDown) {

          this.player_.SwipeDown(timeElapsed);
          this.swipeDown = false;

        }
      }
    }

    //restart stage
    if (this.restartStage && !this.checkRestart) {
      this.checkRestart = true;

      this.camera_.position.set(-10, 5, 0)
      this.camera_.lookAt(0, 2, 0)
      this.allowPause = false;
      this.restartStage = false;
      this.gameOver_ = true;
      this.stageLoadCheck = false;
      if (this.player_.immunitiy) {
        this.player_.soundShield.pause();
        this.player_.soundShield.currentTime = 0;
      }
      this.player_.soundRunning.pause();
      pauseButton.style.display = 'none'
      document.querySelector('#pauseDiv').style.display = 'none'
      this.stage1lose = true;

      if (this.stage != 1) {
        document.getElementById("shieldTimer").style.zIndex = "-1";
        document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("sheildHUD-blue").style.zIndex = "-1"
        document.getElementById("sheildHUD-green").style.zIndex = "-1"
        document.getElementById("sheildHUD-yellow").style.zIndex = "-1"

      }

      document.querySelector('#video-container').style.background = ""
      document.getElementById('loading-button-container').style.display = 'block';

      if (this.stage == 2) {
        this.playNextStageVideo2();
        this.eventAdded = false;
        this.startLoad1 = false;
        this.countdown1_ = 6;
        this.checkRestart = false;
        this.NotFirstTry = true;
        document.getElementById('loading2-next').style.display = 'none';
        document.getElementById('stage2-intro1').style.display = 'none'
        document.getElementById('stage2-intro2').style.display = 'none'
        document.getElementById('stage2-intro3').style.display = 'none'
      } else if (this.stage == 3 || this.stage == 4) {
        this.playNextStageVideo3();
        this.eventAdded1 = false;
        this.countdown2_ = 6;
        this.startLoad2 = false;
        this.checkRestart = false;
        this.NotFirstTry = true;
        document.getElementById('loading3-next').style.display = 'none';
        document.getElementById('stage3-intro1').style.display = 'none'
        document.getElementById('stage3-intro2').style.display = 'none'
        document.getElementById('stage3-intro3').style.display = 'none'

        document.getElementById("rescue1").src = "./resources/Rescued_Friend_UI/Friend1_notsaved.png"
        document.getElementById("rescue2").src = "./resources/Rescued_Friend_UI/Friend2_notsaved.png"
        document.getElementById("rescue3").src = "./resources/Rescued_Friend_UI/Friend3_notsaved.png"
        document.getElementById("rescue4").src = "./resources/Rescued_Friend_UI/Friend4_notsaved.png"
        document.getElementById("rescue5").src = "./resources/Rescued_Friend_UI/Friend5_notsaved.png"
        this.player_.friendsSaved = 0;

      } else if (this.stage == 1) {
        this.playNextStageVideo1();
        this.eventAdded3 = false;
        this.countdown_ = 6;
        this.checkRestart = false;
        this.NotFirstTry = true;

        document.getElementById('loading1-next').style.display = 'none';
        document.getElementById('stage1-intro1').style.display = 'none'
        document.getElementById('stage1-intro2').style.display = 'none'
        document.getElementById('stage1-intro3').style.display = 'none'
      }

      this.stopTime = true
      this.Pause()
    }

    //if game is over (lost)
    if (this._gameStarted && this.player_.gameOver && !this.gameOver_) {
      if (this.player_.immunitiy) {
        this.player_.soundShield.pause();
        this.player_.soundShield.currentTime = 0;
      }
      this.player_.soundRunning.pause();
      this.showChase = false;
      this.allowPause = false;
      this.gameOver_ = true;
      this.stage1lose = true;

      this.failedStage = true;
      this.resumeCountdown_ = 3;
      this.stageLoadCheck = false;

      var gameOverScreen = document.getElementById("game-over");
      gameOverScreen.classList.toggle('active');
      var gameOveIndex = document.getElementById("game-over-index");
      gameOveIndex.style.zIndex = 10;

      if (this.player_.death == "pit") {
        if (this.gender_ == "male") {
          gameOverScreen.classList.add("game-over-pitboy");

        } else {
          gameOverScreen.classList.add("game-over-pitgirl");

        }

      } else if (this.player_.death == "bird") {
        if (this.gender_ == "male") {
          gameOverScreen.classList.add("game-over-boybird");

        } else {
          gameOverScreen.classList.add("game-over-girlbird");

        }
      } else if (this.player_.death == "slap") {
        if (this.gender_ == "male") {
          gameOverScreen.classList.add("game-over-boyslap");

        } else {
          gameOverScreen.classList.add("game-over-girlslap");

        }
      } else if (this.player_.death == "") {
        if (this.gender_ == "male") {
          gameOverScreen.classList.add("game-over-boy");

        } else {
          gameOverScreen.classList.add("game-over-girl");

        }
      }


      pauseButton.style.display = 'none'

      document.getElementById("shieldTimer").style.zIndex = "-1";
      document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("sheildHUD-blue").style.zIndex = "-1"
      document.getElementById("sheildHUD-green").style.zIndex = "-1"
      document.getElementById("sheildHUD-yellow").style.zIndex = "-1"

      document.getElementById("rescue1").src = "./resources/Rescued_Friend_UI/Friend1_notsaved.png"
      document.getElementById("rescue2").src = "./resources/Rescued_Friend_UI/Friend2_notsaved.png"
      document.getElementById("rescue3").src = "./resources/Rescued_Friend_UI/Friend3_notsaved.png"
      document.getElementById("rescue4").src = "./resources/Rescued_Friend_UI/Friend4_notsaved.png"
      document.getElementById("rescue5").src = "./resources/Rescued_Friend_UI/Friend5_notsaved.png"
      this.player_.friendsSaved = 0;

      document.querySelector('#video-container').style.background = ""

      document.getElementById('try-again-button').addEventListener('click', () => {
        var soundSelect = document.getElementById("sound-click");
        soundSelect.play();
        document.getElementById('game-over').classList.remove('active');
        document.getElementById('loading-button-container').style.display = 'block';
        gameOveIndex.style.zIndex = 0;

        if (this.stage == 2) {
          this.playNextStageVideo2();
          this.eventAdded = false;
          this.startLoad1 = false;

          this.countdown1_ = 6;
          this.NotFirstTry = true;
          document.getElementById('loading2-next').style.display = 'none';
          document.getElementById('stage2-intro1').style.display = 'none'
          document.getElementById('stage2-intro2').style.display = 'none'
          document.getElementById('stage2-intro3').style.display = 'none'
        } else if (this.stage == 3) {
          this.playNextStageVideo3();
          this.eventAdded1 = false;
          this.startLoad2 = false;

          this.countdown2_ = 6;
          this.NotFirstTry = true;
          document.getElementById('loading3-next').style.display = 'none';
          document.getElementById('stage3-intro1').style.display = 'none'
          document.getElementById('stage3-intro2').style.display = 'none'
          document.getElementById('stage3-intro3').style.display = 'none'
        } else if (this.stage == 1) {
          this.playNextStageVideo1();
          this.eventAdded3 = false;
          this.countdown_ = 6;
          this.NotFirstTry = true;
          document.getElementById('loading1-next').style.display = 'none';
          document.getElementById('stage1-intro1').style.display = 'none'
          document.getElementById('stage1-intro2').style.display = 'none'
          document.getElementById('stage1-intro3').style.display = 'none'
        }

        if (this.player_.death == "pit") {
          if (this.gender_ == "male") {
            gameOverScreen.classList.remove("game-over-pitboy");

          } else {
            gameOverScreen.classList.remove("game-over-pitgirl");

          }

        } else if (this.player_.death == "bird") {
          if (this.gender_ == "male") {
            gameOverScreen.classList.remove("game-over-boybird");

          } else {
            gameOverScreen.classList.remove("game-over-girlbird");

          }
        } else if (this.player_.death == "slap") {
          if (this.gender_ == "male") {
            gameOverScreen.classList.remove("game-over-boyslap");

          } else {
            gameOverScreen.classList.remove("game-over-girlslap");

          }
        } else if (this.player_.death == "") {
          if (this.gender_ == "male") {
            gameOverScreen.classList.remove("game-over-boy");

          } else {
            gameOverScreen.classList.remove("game-over-girl");

          }
        }
        this.manDead = false;
        this.collapsed = false;

        // this.stopTime = true
        // this.Pause()
      });

    }
  }
}

//fps stats
var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

function animate() {
  stats.begin();
  // monitored code goes here
  stats.end();
  requestAnimationFrame(animate);

}

requestAnimationFrame(animate);

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();

});

