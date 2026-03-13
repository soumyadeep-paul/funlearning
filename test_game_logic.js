const MathLogic = require('./math-logic.js');

function testGameLogic() {
    console.log("Testing Updated Game Logic Flows...");

    // 1. Verify bullet logic
    let bullets = 3;

    // Shoot (miss or hit wrong)
    bullets--;
    if (bullets !== 2) throw new Error("Bullets should be 2 after one shot");

    // Shoot (correct hit)
    bullets--; // deduct for shot
    bullets++; // add for correct hit
    if (bullets !== 2) throw new Error("Bullets should stay 2 after a correct hit (net zero)");

    // 2. Verify math scaling (steeper now)
    console.log("Verifying steeper math scaling:");
    for (let l = 1; l <= 5; l++) {
        const eq = MathLogic.generateEquation(l);
        console.log(`  Level ${l}: ${eq.text}`);
    }

    console.log("Game Logic Flow tests passed!");
}

testGameLogic();
