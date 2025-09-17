import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  logo: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  userText: GameObjects.Text | null = null;

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.background = null;
    this.logo = null;
    this.title = null;
    this.userText = null;
  }

  async create() {
    await this.loadUserInfo();
    this.refreshLayout();

    // Re-calculate positions whenever the game canvas is resized (e.g. orientation change).
    this.scale.on('resize', () => this.refreshLayout());

    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }

  private async loadUserInfo() {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      if (!this.userText) {
        this.userText = this.add.text(20, 20, `User: ${data.userId}`, {
          fontSize: '16px',
          color: '#ffffff'
        });
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;

    // Resize camera to new viewport to prevent black bars
    this.cameras.resize(width, height);

    // Background – stretch to fill the whole canvas
    if (!this.background) {
      this.background = this.add.image(0, 0, 'background').setOrigin(0);
    }
    this.background!.setDisplaySize(width, height);

    // Logo – keep aspect but scale down for very small screens
    const scaleFactor = Math.min(width / 1024, height / 768);

    if (!this.logo) {
      this.logo = this.add.image(0, 0, 'logo');
    }
    this.logo!.setPosition(width / 2, height * 0.38).setScale(scaleFactor);

    // Title text – create once, then scale on resize
    const baseFontSize = 38;
    if (!this.title) {
      this.title = this.add
        .text(0, 0, 'PLAY', {
          fontFamily: 'Arial Black',
          fontSize: `${baseFontSize}px`,
          color: '#ffffff',
          stroke: '#6666ff',
          align: 'center',
        })
        .setOrigin(0.25);
    }
    this.title!.setPosition(width / 2, height * 0.75);
    this.title!.setScale(scaleFactor);

    // User text positioning
    if (this.userText) {
      this.userText.setPosition(20, 20);
    }
  }
}
