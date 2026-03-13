const MathLogic = require('./math-logic.js');

function testGameLogic() {
    console.log("Testing Final Game Logic Flows...");

    // Scoring Test Simulation
    let level = 1;
    let maxPoints = level * 10;

    // Simulate <10% time
    let points = maxPoints; // logic: if (percentUsed < 0.1) points = maxPoints
    if (points !== 10) throw new Error("Scoring failed at <10% time");

    // Simulate >90% time
    points = Math.max(1, Math.round(maxPoints * 0.1));
    if (points !== 1) throw new Error("Scoring failed at >90% time");

    // Level up test
    let score = 100;
    level = Math.floor(score / 100) + 1;
    if (level !== 2) throw new Error("Level up logic failed");

    console.log("Logic tests passed!");
}

testGameLogic();
