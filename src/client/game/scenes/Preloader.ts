import { Scene } from 'phaser';
import { showDirections } from '../main';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'assets/bg.png');
    };


  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath('assets');

    this.load.image('logo', 'logo-light.png');
    
    // Load fonts
    this.load.font('AnnieUseYourTelescope', 'fonts/Annie_Use_Your_Telescope/AnnieUseYourTelescope-Regular.ttf');
    this.load.font('Montserrat', 'fonts/Montserrat/static/Montserrat-Regular.ttf');
    this.load.font('MontserratBold', 'fonts/Montserrat/static/Montserrat-Bold.ttf');
    this.load.image('play', 'play.png');
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    // Create directions button
    const container = document.getElementById('directions-container');
    if (container) {
      const button = document.createElement('button');
      button.className = 'cursor-pointer';
      button.id = 'directions';
      
      const img = document.createElement('img');
      img.src = 'assets/question.png';
      img.alt = '?';
      img.style.width = '25px';
      img.style.height = 'auto';
      img.style.verticalAlign = 'middle';
      
      button.appendChild(img);
      container.appendChild(button);
      
      button.addEventListener('click', showDirections);
    }

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu');
  }
}
