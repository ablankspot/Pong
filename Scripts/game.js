var Game = function () { 
    // Set the width and height of the scene.
    this._width = 1920;
    this._height = 1080;

    // Setup the backgournd canvas.
    this._bgRenderer = new PIXI.CanvasRenderer(this._width, this._height);
    document.body.appendChild(this._bgRenderer.view);
    this._bgStage = new PIXI.Stage();

    // Setup the rendering surface.
    this._renderer = new PIXI.CanvasRenderer(this._width, this._height, { transparent: true });
    document.body.appendChild(this._renderer.view);

    // Create the main stage to draw on.
    this._stage = new PIXI.Stage();

    // Area of the goal space behind the paddle.
    this._goalSpaceWidth = Math.ceil(this._width / 10);

    this.build();
}

Game.prototype =
{
    /**
     * Build the scene.
     */    
    build: function () { 
        this.drawBoundaries();
        this.drawBackground();
        this.createPaddles();
        this.createBall();

        // Begin the first frame.
        requestAnimationFrame(this.tick.bind(this));
    },
    
    /**
     * Draws the play field boundaries.
     */
    drawBoundaries: function () {
        // Draw the borders.
        var walls = new PIXI.Graphics();
        walls.beginFill(0xFFFFFF, 0.5);
        walls.drawRect(0, 0, this._width, 10);
        walls.drawRect(this._width - 10, 10, 10, this._height - 20);
        walls.drawRect(0, this._height - 10, this._width, 10);
        walls.drawRect(0, 10, 10, this._height - 20);

        // Attach the walls to the background stage.
        this._bgStage.addChild(walls);

        // Render the boundaries once.
        this._bgRenderer.render(this._bgStage);
    },
    
    /**
     * Draw the background elements.
     */
    drawBackground: function () {
        var endPointY = this._height - 20;

        // Draw the  'goal' lines.
        // Left goal line.
        var goalLineLeft = new PIXI.Graphics();
        var startPointL = [this._goalSpaceWidth, 10];
        goalLineLeft.position.set(startPointL[0], startPointL[1]);

        goalLineLeft.lineStyle(5, 0xff0000, 0.5)
            .moveTo(0, 0)
            .lineTo(0, endPointY);

        // Right goal line.
        var goalLineRight = new PIXI.Graphics();
        var startPointR = [this._width - this._goalSpaceWidth, 10];

        goalLineRight.position.set(startPointR[0], startPointR[1]);
        goalLineRight.lineStyle(5, 0xff0000, 0.5)
            .moveTo(0, 0)
            .lineTo(0, endPointY);

        // Creating dashed line for the middle.
        var middleLine = new PIXI.Graphics();
        var startPointM = [this._width / 2, 10];

        // The length of the dash.
        var dashedLength = 20;

        // The space between dashes.
        var spaceLength = 12;
        
        middleLine.position.set(startPointM[0], startPointM[1]);
        var y = 0;
        var j = 0;

        do {
            middleLine.lineStyle(3, 0xffffff)
                .moveTo(0, y)
                .lineTo(0, y + dashedLength);
            
            j++;
            y = (j * (dashedLength + spaceLength));
        } while (y < this._height - (dashedLength + spaceLength));
        
        this._bgStage.addChild(middleLine);
        this._bgStage.addChild(goalLineLeft);
        this._bgStage.addChild(goalLineRight);
        this._bgRenderer.render(this._bgStage);
    },

    /**
     * Creates the paddles for the players.
     */
    createPaddles: function () { 
        var paddleWidth = 20;
        var paddleHeight = 150;

        // [0] -> left paddle
        // [1] -> right paddle
        var paddleGraphics = [];

        // Create left paddle
        paddleGraphics[0] = new PIXI.Graphics();
        
        paddleGraphics[0].beginFill(0xffffff);
        paddleGraphics[0].drawRoundedRect(this._goalSpaceWidth + 4, (this._height / 2) - (paddleHeight/2), paddleWidth, paddleHeight, 5);
        paddleGraphics[0].endFill();

        // Create right paddle.
        paddleGraphics[1] = new PIXI.Graphics();

        paddleGraphics[1].beginFill(0xffffff);
        paddleGraphics[1].drawRoundedRect(this._width - this._goalSpaceWidth - paddleWidth - 4, (this._height / 2) - (paddleHeight / 2), paddleWidth, paddleHeight, 5);
        paddleGraphics[1].endFill();

        this._stage.addChild(paddleGraphics[0]);
        this._stage.addChild(paddleGraphics[1]);
    },

    /**
     * Creates the ball to play with.
     */
    createBall: function () {
        var ballGraphics = new PIXI.Graphics();

        ballGraphics.beginFill(0xffffff);
        ballGraphics.drawCircle(this._width / 2, this._height / 2, 30);
        ballGraphics.endFill();

        this._stage.addChild(ballGraphics);
    },

    /**
     * Fires at the end of the gameloop to reset and redraw the canvas.
     */
    tick: function () {
        this._renderer.render(this._stage);
        requestAnimationFrame(this.tick.bind(this));
     }    
}