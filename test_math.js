const MathLogic = require('./math-logic.js');

function test() {
    console.log("Testing Math Logic...");

    for (let level = 1; level <= 10; level++) {
        console.log(`\nLevel ${level}:`);
        for (let i = 0; i < 5; i++) {
            const eq = MathLogic.generateEquation(level);
            const distractors = MathLogic.generateDistractors(eq.answer, level);

            console.log(`  ${eq.text} -> Correct: ${eq.answer}, Distractors: [${distractors.join(', ')}]`);

            // Check if answer is correct
            let result;
            if (eq.op === '+') result = eq.num1 + eq.num2;
            if (eq.op === '-') result = eq.num1 - eq.num2;
            if (eq.op === '*') result = eq.num1 * eq.num2;
            if (eq.op === '/') result = eq.num1 / eq.num2;

            if (result !== eq.answer) {
                console.error(`  ERROR: Incorrect answer generation for ${eq.text}`);
                process.exit(1);
            }

            if (distractors.includes(eq.answer)) {
                console.error(`  ERROR: Correct answer included in distractors!`);
                process.exit(1);
            }
        }
    }
    console.log("\nMath Logic tests passed!");
}

test();
