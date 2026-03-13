// Math Logic and Difficulty Progression

const MathLogic = {
    generateEquation(level) {
        const operations = ['+', '-', '*', '/'];
        let op;

        // Steeper introduction of operations
        if (level === 1) {
            op = '+';
        } else if (level === 2) {
            op = Math.random() > 0.5 ? '+' : '-';
        } else if (level === 3) {
            op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        } else {
            op = operations[Math.floor(Math.random() * 4)];
        }

        let num1, num2, answer;

        // Use a minimum number that scales with level to keep difficulty consistent
        const minNum = Math.floor(level * 1.5);
        const maxNum = 10 + (level * 5);

        switch (op) {
            case '+':
                num1 = Math.floor(Math.random() * (maxNum - minNum)) + minNum;
                num2 = Math.floor(Math.random() * (maxNum - minNum)) + minNum;
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * (maxNum - minNum)) + minNum + 5;
                num2 = Math.floor(Math.random() * (num1 - minNum)) + minNum;
                answer = num1 - num2;
                break;
            case '*':
                // Multipliers shouldn't be too huge for 7-10y, but 0/1 are boring
                const minMul = Math.min(2 + Math.floor(level/3), 5);
                const maxMul = 5 + Math.floor(level * 1.2);
                num1 = Math.floor(Math.random() * (maxMul - minMul)) + minMul;
                num2 = Math.floor(Math.random() * (maxMul - minMul)) + minMul;
                answer = num1 * num2;
                break;
            case '/':
                const minD = Math.min(2 + Math.floor(level/3), 5);
                const maxD = 5 + level;
                num2 = Math.floor(Math.random() * (maxD - minD)) + minD;
                answer = Math.floor(Math.random() * (maxD - minD)) + minD;
                num1 = num2 * answer;
                break;
        }

        return {
            text: `${num1} ${op} ${num2} = ?`,
            answer: answer,
            num1, num2, op
        };
    },

    generateDistractors(correctAnswer, level) {
        const distractors = new Set();
        const count = 3;

        while (distractors.size < count) {
            // Distractors range also scales with level/answer size
            let range = Math.max(10, Math.floor(correctAnswer * 0.5));
            let offset = Math.floor(Math.random() * range) + 1;
            if (Math.random() > 0.5) offset *= -1;

            let distractor = correctAnswer + offset;
            if (distractor >= 0 && distractor !== correctAnswer) {
                distractors.add(distractor);
            }
        }

        return Array.from(distractors);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathLogic;
}
