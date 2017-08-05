// Game state constants.
var START_SCREEN = 0;
var IN_GAME = 1;
var PAUSE = 2;
var END_GAME = 3;


var Game = function () { 
    // Set the width and height of the scene.
    this._width = 1920;
    this._height = 1080;

    // Set the initial game state.
    this._gameState = START_SCREEN;

    // Setup the backgournd canvas.
    this._bgRenderer = new PIXI.CanvasRenderer(this._width, this._height);
    document.body.appendChild(this._bgRenderer.view);
    this._bgStage = new PIXI.Container();

    // Setup the rendering surface.
    this._renderer = new PIXI.CanvasRenderer(this._width, this._height, { transparent: true });
    document.body.appendChild(this._renderer.view);

    // Create the main stage to draw on.
    this._stage = new PIXI.Container();

    // Setup physics world.
    this._world = new p2.World({ gravity: [0, 0] });

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
        this.drawStartScreen();

        // Begin the first frame.
        requestAnimationFrame(this.tick.bind(this));
        
    },

    /**
     * Draws the start screen for the game.
     */
    drawStartScreen: function () {
        // Create logo
        this._logo = PIXI.Sprite.fromImage("Assets/Logo.png");
        this._logo.x = 200;
        this._logo.y = 10;
        this._logo.width = this._width - (this._goalSpaceWidth * 2) - 20;
        this._logo._height = Math.round(this._height / 2);

        // Create Textures for the buttons.
        var buttonTexture = PIXI.Texture.fromImage("Assets/OnePlayerButton.png");
        var buttonOverTexture = PIXI.Texture.fromImage("Assets/OnePlayerButtonHover.png");

        // Create the button for one player game.
        this._onePlayerButton = new PIXI.Sprite(buttonTexture);
        this._onePlayerButton.x = 200;
        this._onePlayerButton.y = Math.round(this._height / 2) + 50;
        this._onePlayerButton.width = Math.round(this._width / 2) - 100 - this._goalSpaceWidth;
        this._onePlayerButton.height = Math.round(this._height / 2) - 200;
        this._onePlayerButton.interactive = true;
        this._onePlayerButton.buttonMode = true;

        // Events for the one player button.
        this._onePlayerButton.on('mouseover', function () {
            this.isOver = true;
            this.texture = buttonOverTexture;
        });

        this._onePlayerButton.on('mouseout', function () {
            this.isOver = false;
            this.texture = buttonTexture;
        });

        this._onePlayerButton.on('mousedown', function () {
            this._stage.removeChild(this._logo);
            this._stage.removeChild(this._onePlayerButton);
            this.initializeInGameComponents();
            this._gameState = IN_GAME;
        }.bind(this));
                
        // Render the Start screen elements.
        this._stage.addChild(this._logo);
        this._stage.addChild(this._onePlayerButton);
        this._renderer.render(this._stage);
    },
    
    /**
     * Draws the play field boundaries.
     */
    drawBoundaries: function () {
               
        // Draw the wall borders.
        var walls = new PIXI.Graphics();
        walls.beginFill(0xFFFFFF, 0.5);
        walls.drawRect(0, 0, this._width, 10);
        walls.drawRect(this._width - 10, 10, 10, this._height - 20);
        walls.drawRect(0, this._height - 10, this._width, 10);
        walls.drawRect(0, 10, 10, this._height - 20);
        walls.endFill();

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
        var paddleBodies = [];

        // Physics body for the left paddle.
        paddleBodies[0] = new p2.Body({
            mass: 1,
            angularVelocity: 0,
            damping: 0,
            angularDamping: 0,
            position: [this._goalSpaceWidth + 4, Math.round(this._height / 2) - Math.round(this._paddleHeight / 2)]
        });

        paddleBodies[1] = new p2.Body({
            mass: 1,
            angularVelocity: 0,
            damping: 0,
            angularDamping: 0,
            position: [this._width - this._goalSpaceWidth- this._paddleWidth - 4, (this._height / 2) - (this._paddleHeight / 2)]
        });

        // Create paddle texture
        var paddleGraphic = new PIXI.Graphics();
        paddleGraphic.beginFill(0xffffff);
        paddleGraphic.drawRoundedRect(0, 0, this._paddleWidth, this._paddleHeight, 5);
        paddleGraphic.endFill();

        var paddleCache = new PIXI.CanvasRenderer(this._paddleWidth, this._paddleHeight, { transparent: true });
        var paddleCacheStage = new PIXI.Stage();
        paddleCacheStage.addChild(paddleGraphic);
        paddleCache.render(paddleCacheStage);
        var paddleTexture = new PIXI.Texture.fromCanvas(paddleCache.view);

        this._paddles = {
            graphics: [new PIXI.Sprite(paddleTexture), new PIXI.Sprite(paddleTexture)],
            body: paddleBodies
        };

        this._paddles.graphics[0].position.set(this._goalSpaceWidth + 4, Math.round(this._height / 2) - Math.round(this._paddleHeight));
        this._paddles.graphics[1].position.set(this._width - this._goalSpaceWidth - this._paddleWidth - 4, (this._height / 2) - (this._paddleHeight / 2));

        this._world.addBody(this._paddles.body[0]);
        this._world.addBody(this._paddles.body[1]);
        this._stage.addChild(this._paddles.graphics[0]);
        this._stage.addChild(this._paddles.graphics[1]);
    },

    /**
     * Creates the ball to play with.
     */
    createBall: function () {

        var x = Math.round(this._width / 2);
        var y = Math.round(this._height / 2);
        var radius = 30;
        var speed = 1200;
        var vx = (Math.random() - 0.5) * speed;
        var vy = (Math.random() - 0.5) * speed;

        // Create ball physics object.
        var ballBody = new p2.Body({
            mass: 1,
            angularVelocity: 0,
            damping: 0,
            angularDamping: 0,
            position: [x - radius, y],
            velocity: [vx, vy]
        });
        
        // Create ball graphics.
        var ballGraphics = new PIXI.Graphics();
        ballGraphics.beginFill(0xffffff);
        ballGraphics.drawCircle(radius, radius, radius);
        ballGraphics.endFill();

        // Cache the ball to only use one draw call per tick.
        var ballCache = new PIXI.CanvasRenderer(radius * 2, radius  * 2, { transparent: true });
        var ballCacheStage = new PIXI.Stage();
        ballCacheStage.addChild(ballGraphics);
        ballCache.render(ballCacheStage);
        var ballTexture = PIXI.Texture.fromCanvas(ballCache.view);

        // Put everything into a ball game object.
        this._ball = {
            graphics: new PIXI.Sprite(ballTexture),
            body: ballBody
        };

        this._world.addBody(this._ball.body);
        this._stage.addChild(this._ball.graphics);
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
     * Renders the scores for the players.
     */
    setupScores: function () {
    
        this._scores = {
            values: [0, 0]
        };

        var fieldWidth = Math.round(this._width / 2) - this._goalSpaceWidth;

        var scoreTextLeft = new PIXI.Text(this._scores.values[0], {
            fontFamily: 'Arial',
            fontSize: '120px',
            fontStyle: 'bold',
            fill: '#cccccc',
            align: 'center'
        });

        scoreTextLeft.x = Math.round(fieldWidth / 2) + this._goalSpaceWidth - 50;
        scoreTextLeft.y = 0;

        var scoreTextRight = new PIXI.Text(this._scores.values[1], {
            fontFamily: 'Arial',
            fontSize: '120px',
            fontStyle: 'bold',
            fill: '#cccccc',
            align: 'center'
        });

        scoreTextRight.x = Math.round(fieldWidth / 2) + Math.round(this._width / 2) - 50;
        scoreTextRight.y = 0;

        this._scores.texts = [scoreTextLeft, scoreTextRight];

        this._stage.addChild(this._scores.texts[0]);
        this._stage.addChild(this._scores.texts[1]);
    },
    
    /**
     * Update the physics of the game within the gameloop.
     */
    updatePhysics: function () {
        
        if (this._gameState == IN_GAME) {
            //===================================================================
            // UPDATE BALL
            //===================================================================
            var x = this._ball.body.position[0];
            var y = this._ball.body.position[1];

            // Hits the lower or upper bound
            if ((y + 60) >= this._height - 10 || y <= 10) {
                this._ball.body.velocity[1] *= -1;
            }

            // Check for a goal.
            if ((x + 65) < this._goalSpaceWidth) {
                // Right player scored.
                this._scores.values[1]++;
                this._scores.texts[1].text = this._scores.values[1];

                // Reset the ball and the paddles.
                this.resetBall();
                this.resetPaddles();
            }
            else if (x > this._width - this._goalSpaceWidth) {
                // Left player scored.
                this._scores.values[0]++;
                this._scores.texts[0].text = this._scores.values[0];

                // Reset the ball and the paddles.
                this.resetBall();
                this.resetPaddles();
            }
        
            // Check if the ball hits a paddle.
            // Coordinates for the left paddle.
            var p1x = this._paddles.body[0].position[0];
            var p1y = this._paddles.body[0].position[1];
            var p2x = this._paddles.body[1].position[0];
            var p2y = this._paddles.body[1].position[1];

            // Is in the X coordinate of the left paddle.
            if (x <= (p1x + this._paddleWidth)) {
                // Is whithin the Y space of the paddle.
                if ((y + 30) >= p1y && (y + 30) <= (p1y + this._paddleHeight)) {
                    this._ball.body.velocity[0] = (this._ball.body.velocity[0] < 0) ? this._ball.body.velocity[0] * -1 : this._ball.body.velocity[0];
                }
            }

            // Is in the X coordinate of the right paddle.
            if ((x + 30) >= (p2x - this._paddleWidth)) {
                // Is whithin the Y space of the paddle.
                if ((y + 30) >= p2y && (y + 30) <= (p2y + this._paddleHeight)) {
                    this._ball.body.velocity[0] = (this._ball.body.velocity[0] > 0) ? this._ball.body.velocity[0] * -1 : this._ball.body.velocity[0];
                }
            }

            this._ball.graphics.x = x;
            this._ball.graphics.y = y;
            //===================================================================

            //===================================================================
            // UPDATE LEFT PADDLE
            //===================================================================
            this._paddleSpeed = 300;

            if (this._keyUp) {
                this._paddleLeftVelocity = -1 * this._paddleSpeed;
            }
            else if (this._keyDown) {
                this._paddleLeftVelocity = this._paddleSpeed;
            }
            else {
                this._paddleLeftVelocity = 0;
            }

            this._paddles.body[0].velocity[1] = this._paddleLeftVelocity;
            this._paddles.graphics[0].y = this._paddles.body[0].position[1];

            // Keep the paddle within the boundaries.
            if (this._paddles.body[0].position[1] <= 10) {
                this._paddles.body[0].position[1] = 10;
            }
            else if (this._paddles.body[0].position[1] >= this._height - this._paddleHeight - 10) {
                this._paddles.body[0].position[1] = this._height - this._paddleHeight - 10;
            }
            //===================================================================

            //===================================================================
            // UPDATE RIGHT PADDLE
            //===================================================================
            this._paddleRightVelocity = 0;
        
            if (this._ball.body.velocity[0] > 0) {
                // The paddle is above the ball.
                if ((p2y + Math.round(this._paddleHeight / 2)) < this._ball.body.position[1] + 30) {
                    this._paddleRightVelocity = this._paddleSpeed;
                }
                else if ((p2y + Math.round(this._paddleHeight / 2)) > this._ball.body.position[1] + 30) {
                    this._paddleRightVelocity = -1 * this._paddleSpeed;
                }
                else {
                    this._paddleRightVelocity = 0;
                }
            }

            this._paddles.body[1].velocity[1] = this._paddleRightVelocity;
            this._paddles.graphics[1].y = this._paddles.body[1].position[1];

            if (this._paddles.body[1].position[1] <= 10) {
                this._paddles.body[1].position[1] = 10;
            } else if (this._paddles.body[1].position[1] >= this._height - this._paddleHeight - 10) {
                this._paddles.body[1].position[1] = this._height - this._paddleHeight - 10;
            }
            //===================================================================
        }

        // Step the physics simulation forward.
        this._world.step(1 / 60);
    },
    
    initializeInGameComponents: function ()
    { 
        this.setupScores();
        this.createPaddles();
        this.createBall();
    },

    /**
     * Fires at the end of the gameloop to reset and redraw the canvas.
     */
    tick: function () {
        this.updatePhysics();
        this._renderer.render(this._stage);
        requestAnimationFrame(this.tick.bind(this));
    },

    /**
     * Resets the physics body of the ball to its initial state.
     */
    resetBall: function () {
        var x = Math.round(this._width / 2);
        var y = Math.round(this._height / 2);
        var radius = 30;
        var speed = 1200;
        var vx = (Math.random() - 0.5) * speed;
        var vy = (Math.random() - 0.5) * speed;

        this._ball.body.position = [x, y];
        this._ball.body.velocity = [vx, vy];
    },
    
    /**
     * Resets the physics body for the paddles to their initial state.
     */
    resetPaddles: function () {
        this._paddles.body[0].position = [this._goalSpaceWidth + 4, Math.round(this._height / 2) - Math.round(this._paddleHeight / 2)];
        this._paddles.body[1].position = [this._width - this._goalSpaceWidth - this._paddleWidth - 4, (this._height / 2) - (this._paddleHeight / 2)];
     }
}