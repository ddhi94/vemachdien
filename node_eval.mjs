const inputStr = 'R4//((R1//R2)ntR3)';

function tokenize(input) {
    const tokens = [];
    let i = 0;

    while (i < input.length) {
        if (input[i] === ' ') { i++; continue; }
        if (input[i] === '(' || input[i] === ')') {
            tokens.push(input[i]);
            i++;
        } else if (input[i] === '/' && input[i + 1] === '/') {
            tokens.push('//');
            i += 2;
        } else if (input.substring(i, i + 2).toLowerCase() === 'nt') {
            const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : '';
            const isAfterValue = prevToken !== '//' && prevToken !== 'nt' && prevToken !== '(' && prevToken !== '';
            if (isAfterValue) {
                tokens.push('nt');
                i += 2;
            } else {
                let name = '';
                while (i < input.length && input[i] !== '/' && input[i] !== '(' && input[i] !== ')') {
                    name += input[i];
                    i++;
                }
                if (name) tokens.push(name);
            }
        } else {
            let name = '';
            let parenLevel = 0;
            while (i < input.length) {
                const char = input[i];
                if (char === '(') parenLevel++;
                else if (char === ')') {
                    if (parenLevel === 0) break;
                    parenLevel--;
                }

                if (parenLevel === 0 && (char === '/' || char === ' ' || (char === 'n' && input[i + 1]?.toLowerCase() === 't'))) {
                    break;
                }

                name += char;
                i++;
            }
            if (name) tokens.push(name);
        }
    }
    return tokens;
}

const tokens = tokenize(inputStr);
console.log("Tokens:", tokens);

function parseExpression(tokens, pos) {
    const seriesItems = [];

    while (pos.index < tokens.length && tokens[pos.index] !== ')') {
        const parallelItems = [];
        parallelItems.push(parseAtom(tokens, pos));

        while (pos.index < tokens.length && tokens[pos.index] === '//') {
            pos.index++;
            parallelItems.push(parseAtom(tokens, pos));
        }

        seriesItems.push(
            parallelItems.length === 1 ? parallelItems[0] : { type: 'parallel', children: parallelItems }
        );

        if (pos.index < tokens.length && tokens[pos.index] === 'nt') {
            pos.index++;
        } else if (pos.index < tokens.length && tokens[pos.index] !== ')' && tokens[pos.index] !== '//') {
            continue;
        } else {
            break;
        }
    }

    return seriesItems.length === 1 ? seriesItems[0] : { type: 'series', children: seriesItems };
}

function parseAtom(tokens, pos) {
    if (pos.index >= tokens.length) return { type: 'component', label: '?' };

    const token = tokens[pos.index];

    if (token === '(') {
        pos.index++;
        const node = parseExpression(tokens, pos);
        if (pos.index < tokens.length && tokens[pos.index] === ')') pos.index++;
        return node;
    }

    if (token === '//' || token === 'nt' || token === ')') {
        return { type: 'component', label: '?' };
    }

    pos.index++;
    return { type: 'component', label: token };
}

console.log(JSON.stringify(parseExpression(tokens, { index: 0 }), null, 2));
