/**
 * @class Game 
 * @author Tristan Gaeta
 * 
 * @description Instances of a Game object contain a matter.js physics engine and renderer, which are run when
 * the game object is created. All of the items in a game's engine-world are created through static methods 
 * within the GameObjects class.
 */
class Game {

    static WIDTH_RATIO = 2; //The unit width of the game-world, render bounds, and display canvas

    static HEIGHT_RATIO = 1; //The unit height of the game-world, render bounds, and display canvas

    static RENDER_SCALE = 30 * GameObjects.BLOCK_SIZE; //The dimension scale for the render bounds

    static WORLD_SCALE = 30 * GameObjects.BLOCK_SIZE; //The dimension scale for the game-world

    static FLOOR_HEIGHT = Game.HEIGHT_RATIO * Game.WORLD_SCALE - 2 * GameObjects.BLOCK_SIZE;

    /**
     * @constructor creates new instances of a Game object. The display canvas for
     * this game object is appended to the current document-body and both the engine 
     * and renderer are run on creation.
     */
    constructor() {
        this.engine = Matter.Engine.create({ enableSleeping: true });

        this.renderer = this.#createRenderer();

        this.mouseConstraint = GameObjects.mouseConstraint(this);

        this.slingShot = GameObjects.slingShot(this, Game.WIDTH_RATIO * Game.WORLD_SCALE / 8, Game.HEIGHT_RATIO * 2 * Game.WORLD_SCALE / 3);

        //We save the previous velocity for every body within the game-world,
        //and remove all projectiles on sleep.
        Matter.Events.on(this.engine, 'beforeUpdate', (event) => {
            let bodies = Matter.Composite.allBodies(event.source.world)
            for (let body of bodies) {
                for (let part of body.parts) {
                    if (part.label == "Projectile" && part.isSleeping) {
                        Matter.Composite.remove(this.engine.world, part, true)
                    } else {
                        part.velocityPrev = part.velocity;
                    }
                }
            }
        })

        Matter.Events.on(this.engine, "afterUpdate", (event) => {
            let bodies = Matter.Composite.allBodies(event.source.world)
            for (let body of bodies) {
                if (body.parts.length > 1) {
                    for (let part of body.parts) {
                        part.angle = body.angle;
                    }
                }
                if (body.label == "Block") {
                    if (body.shockAbsorbed > 500) {
                        Matter.Composite.remove(event.source.world, body, true)
                    }
                }
            }
        })

        //We update the 'shockAbsorbed' by each body on impact. This value is calculated 
        //pair-wise by the difference in linear momentum of the two objects before impact.
        Matter.Events.on(this.engine, "collisionStart", (event) => {
            for (let pair of event.pairs) {
                let momentumA = Matter.Vector.mult(pair.bodyA.velocityPrev, pair.bodyA.isStatic ? 0 : pair.bodyA.mass);
                let momentumB = Matter.Vector.mult(pair.bodyB.velocityPrev, pair.bodyB.isStatic ? 0 : pair.bodyB.mass);
                let mag = Matter.Vector.magnitude(Matter.Vector.sub(momentumA, momentumB));
                pair.bodyA.shockAbsorbed = pair.bodyA.shockAbsorbed || 0;
                pair.bodyA.shockAbsorbed += Math.floor(mag);
                pair.bodyA.parent.shockAbsorbed = pair.bodyA.parent.shockAbsorbed || 0;
                pair.bodyA.parent.shockAbsorbed += pair.bodyA.shockAbsorbed;

                pair.bodyB.shockAbsorbed = pair.bodyB.shockAbsorbed || 0;
                pair.bodyB.shockAbsorbed += Math.floor(mag);
                pair.bodyB.parent.shockAbsorbed = pair.bodyB.parent.shockAbsorbed || 0;
                pair.bodyB.parent.shockAbsorbed += pair.bodyB.shockAbsorbed;
            }
        })

        let floor = Matter.Bodies.rectangle(Game.WIDTH_RATIO * Game.WORLD_SCALE / 2, Game.FLOOR_HEIGHT + 2 * GameObjects.BLOCK_SIZE, Game.WIDTH_RATIO * Game.WORLD_SCALE, 4 * GameObjects.BLOCK_SIZE,
            { isStatic: true, label: "Ground", friction: 1, render: { sprite: { texture: "images/Grass_Long.png", xScale: 2, yScale: 2 } } });

        Matter.Composite.add(this.engine.world, [floor, this.slingShot, this.slingShot.bodyB, this.mouseConstraint,
            GameObjects.arch(3000, Game.FLOOR_HEIGHT - 5 * GameObjects.BLOCK_SIZE), GameObjects.arch(3000, Game.FLOOR_HEIGHT - 10 * GameObjects.BLOCK_SIZE), GameObjects.arch(3000 - 5 * GameObjects.BLOCK_SIZE, Game.FLOOR_HEIGHT - 5 * GameObjects.BLOCK_SIZE)])
        Matter.Render.run(this.renderer);
        Matter.Runner.run(this.engine);
    }

    /**
     * @description this method creates a renderer object and maximizes the canvas
     * size.
     * 
     * @returns a matter.js render object
     */
    #createRenderer() {
        let pageWidth = document.body.clientWidth;
        let pageHeight = window.innerHeight - 16;
        if (pageWidth / pageHeight > Game.WIDTH_RATIO / Game.HEIGHT_RATIO) {
            pageWidth = Game.WIDTH_RATIO * pageHeight / Game.HEIGHT_RATIO
        } else {
            pageHeight = Game.HEIGHT_RATIO * pageWidth / Game.WIDTH_RATIO
        }

        let render = Matter.Render.create({
            element: document.body,
            engine: this.engine,
            bounds: Matter.Bounds.create([{ x: 0, y: 0 }, { x: Game.WIDTH_RATIO * Game.RENDER_SCALE, y: 0 }, { x: Game.WIDTH_RATIO * Game.RENDER_SCALE, y: Game.HEIGHT_RATIO * Game.RENDER_SCALE }, { x: 0, y: Game.HEIGHT_RATIO * Game.RENDER_SCALE }]),
            hasBounds: true,
            options: {
                background: "images/background.png",
                showDebug: true,
                showSleeping: false,
                width: pageWidth,
                height: pageHeight,
                wireframes: false,
                wireframeBackground: false,
            },
        });
        return render;
    }
}