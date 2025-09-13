import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background').setDisplaySize(1024, 768);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');

        // Load all songs
        this.load.audio('intro', 'sounds/intro-theme.mp3');
        
        // Load all client avatars
        this.load.image('tech-bro', 'tech-bro.png');
        this.load.image('man', 'man.png');
        this.load.image('woman', 'woman.png');
        this.load.image('young-woman', 'young-woman.png');
        this.load.image('young-man', 'young-man.png');
        this.load.image('old-man', 'old-man.png');
        this.load.image('sad-businessman', 'sad-businessman.png');
        this.load.image('shopkeeper', 'shopkeeper.png');
        
        // Load scenario data
        this.load.json('scenarios', 'scenarios.json');

        // Load all client voices
        // this.load.audio('tech-bro', 'tech-bro.mp3');
        // this.load.audio('man', 'man.mp3');
        // this.load.audio('woman', 'woman.mp3');
        // this.load.audio('young-woman', 'young-woman.mp3');
        // this.load.audio('young-man', 'young-man.mp3');
        this.load.audio('old-man', 'sounds/old-man.m4a');
        // this.load.audio('sad-businessman', 'sad-businessman.m4a');
        // this.load.audio('shopkeeper', 'shopkeeper.mp3');

        // Load all sound effects
        this.load.audio('hover', 'sounds/bloop.mp3');
        this.load.audio('keyboard-soft', 'sounds/keyboard-typing-soft.mp3');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
