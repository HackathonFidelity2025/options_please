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
        this.load.image('tech-bro', 'tech-bro.png');
        
        // Load broker desk backgrounds
        this.load.image('background3', 'op-bg-3.png');
        this.load.image('background2', 'op-bg-2.png');
        
        // Load scenarios data
        this.load.json('scenarios', '../src/scenarios.json');
        
        // Load sprites for game entities (keys must match scenario.json sprite references)
        this.load.image('tech-bro', 'tech-bro.png'); // Direct key mapping for client_001
        this.load.image('client_tech_enthusiast', 'tech-bro.png'); // Legacy key
        this.load.image('client_retiree', 'tech-bro.png'); // Using existing as placeholder
        this.load.image('headline_paper', 'bg.png'); // Using existing as placeholder
        this.load.image('rumor_note', 'bg.png'); // Using existing as placeholder
        this.load.image('chart_slip', 'bg.png'); // Using existing as placeholder
        this.load.image('economic_report', 'bg.png'); // Using existing as placeholder
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
