// Math Logic and Difficulty Progression

const MathLogic = {
    generateEquation(level) {
        const operations = ['+', '-', '*', '/'];
        let op;

        // At early levels, stick to + and -
        if (level <= 2) {
            op = operations[Math.floor(Math.random() * 2)];
        } else if (level <= 5) {
            op = operations[Math.floor(Math.random() * 3)];
        } else {
            op = operations[Math.floor(Math.random() * 4)];
        }

        let num1, num2, answer;
        const maxNum = 10 + (level * 2);

        switch (op) {
            case '+':
                num1 = Math.floor(Math.random() * maxNum);
                num2 = Math.floor(Math.random() * maxNum);
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * maxNum) + 1;
                num2 = Math.floor(Math.random() * num1); // Ensure positive result
                answer = num1 - num2;
                break;
            case '*':
                const maxMul = 5 + Math.floor(level / 2);
                num1 = Math.floor(Math.random() * maxMul);
                num2 = Math.floor(Math.random() * maxMul);
                answer = num1 * num2;
                break;
            case '/':
                const maxDiv = 5 + Math.floor(level / 2);
                num2 = Math.floor(Math.random() * maxDiv) + 1; // Divisor
                answer = Math.floor(Math.random() * maxDiv); // Quotient
                num1 = num2 * answer; // Dividend
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
        const count = 3; // We want 4 saucers total (1 correct + 3 distractors)

        while (distractors.size < count) {
            let offset = Math.floor(Math.random() * 10) + 1;
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
