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

    // Keyboard event listeners.
    window.addEventListener('keydown', function (event) {
        this.handleKeys(event.keyCode, true);
    }.bind(this), false);

    window.addEventListener('keyup', function (event) {
        this.handleKeys(event.keyCode, false);
    }.bind(this), false);

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
        this._paddleWidth = 20;
        this._paddleHeight = 150;

        // [0] -> left paddle
        // [1] -> right paddle
        this._paddleGraphics = [];

        // Create left paddle
        this._paddleGraphics[0] = new PIXI.Graphics();
        this._paddleGraphics[0].position.set(this._goalSpaceWidth + 4, (this._height / 2) - (this._paddleHeight / 2));
        this._paddleGraphics[0].beginFill(0xffffff);
        this._paddleGraphics[0].moveTo(0, 0);
        this._paddleGraphics[0].drawRoundedRect(0, 0, this._paddleWidth, this._paddleHeight, 5);
        this._paddleGraphics[0].endFill();

        // Create right paddle.
        this._paddleGraphics[1] = new PIXI.Graphics();
        this._paddleGraphics[1].position.set(this._width - this._goalSpaceWidth - this._paddleWidth - 4, (this._height / 2) - (this._paddleHeight / 2));
        this._paddleGraphics[1].beginFill(0xffffff);
        this._paddleGraphics[1].moveTo(0, 0);
        this._paddleGraphics[1].drawRoundedRect(0, 0, this._paddleWidth, this._paddleHeight, 5);
        this._paddleGraphics[1].endFill();

        this._stage.addChild(this._paddleGraphics[0]);
        this._stage.addChild(this._paddleGraphics[1]);
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
     * Handle key presses and filter them.
     * @param {Number}  code    Key code pressed.
     * @param {Boolean} state   true/false
     */
    handleKeys: function (code, state) {
        switch (code) {
            case 38: // Up
                this._keyUp = state;
                break;
            case 40: // Down
                this._keyDown = state;
                break;
        }
    },

    /**
     * Update the physics of the game within the gameloop.
     */
    updatePhysics: function () {
        this._paddleSpeed = 15;

        if (this._keyUp) {
            this._paddleVelocity = -1 * this._paddleSpeed;
        }
        else if (this._keyDown) {
            this._paddleVelocity = this._paddleSpeed;
        }
        else {
            this._paddleVelocity = 0;
        }

        var newY = this._paddleGraphics[0].position.y + this._paddleVelocity;

        // Keep the paddle within the boundaries.
        if (newY >= 20 && newY <= this._height - this._paddleHeight - 20) {
            // The input only updates the player on the left (P1).
            this._paddleGraphics[0].position.set(this._paddleGraphics[0].position.x, newY);
        }
    },
    
    /**
     * Fires at the end of the gameloop to reset and redraw the canvas.
     */
    tick: function () {
        this.updatePhysics();
        this._renderer.render(this._stage);
        requestAnimationFrame(this.tick.bind(this));
     }    
}