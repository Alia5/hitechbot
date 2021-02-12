import { addImageCallback, ImageData } from './imageHook';
import { sleep, findImage } from './utils';

const BASE_DELAY_MS = 2000 as const;
const ADD_DELAY_MAX_MS = 2000 as const;

const DELAY_BETWEEN_PAIRS = true as const;

type ResultMap = {
    [K in string]: {
        a?: string|number;
        b?: string|number;
        foundPair: boolean
    };
};

const resultMap = [...Array(16).keys()].reduce((res, curr) => {
    res[curr.toString()] = {
        a: undefined,
        b: undefined,
        foundPair: false,
    };
    return res;
}, {} as ResultMap);

export const knowsBoth = (baseIdNum: string): boolean => resultMap[baseIdNum].a !== undefined && resultMap[baseIdNum].b !== undefined;
export const solved = (baseIdNum: string): boolean => resultMap[baseIdNum].foundPair;
export const isGameDone = (data: { done: 'true'|'false'; cancel?: 'true'|'false'}) => {
    if (data.cancel === 'true') {
        throw new Error('Shit! We\'ve been detected!');
    };
    return data.done === 'true';
}

let cardPromiseResolver: ((value: unknown) => void)|undefined;

const clickCard = async (num: string|number): Promise<{ number: number, data: ImageData, base64: string }> => {
    const prom = new Promise<{ number: number, data: ImageData, base64: string }>((resolve, reject) => {
        cardPromiseResolver = resolve as any;
        setTimeout(() => reject('Timeout'), 5000);
    });
    window.clickCard(num.toString());
    return prom;
};

export const runBot = async () => {

    // from here on out. code gets messy...
    
    addImageCallback(async (number, data, base64) => {
        if (!!cardPromiseResolver) {
            cardPromiseResolver({ number, data, base64 });
            return;
        }
        console.warn('No Promise resolver!', number, data);
    });

    let unsolvedImages = [...Array(32).keys()].sort(() => 0.5 - Math.random())
    let i = 0;
    let isSecond = false;

    const checkI = () => {
        if (i >= unsolvedImages.length) {
            i = 0;
            unsolvedImages = [...unsolvedImages].sort(() => 0.5 - Math.random())
        }
    };
    const incI = () => {
        i++;
        checkI();
    };

    const startTime = Date.now();
    while(!Object.values(resultMap).every((v) => v.foundPair) && unsolvedImages.length > 0) {
        if (!isSecond) {
            if (DELAY_BETWEEN_PAIRS) {
                await sleep(BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS));
            }

            for (let k = 0; k < 15; k++) {
                const v = resultMap[k.toString()];
                if (v.a && v.b && !v.foundPair) {
                    console.log(`Knowing pair ${k} in Pre-Pair Check... Solving!`);
                    const imageResponseA = await clickCard(v.a);
                    console.log('imageResponse A', imageResponseA, `${k}_a`, '\n');
                    if (DELAY_BETWEEN_PAIRS) {
                        const delayTime = BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS);
                        await sleep( delayTime);
                    }
                    const imageResponseB = await clickCard(v.b);
                    console.log('imageResponse B', imageResponseB, `${k}_b`, '\n');
                    if (imageResponseB.data.newpair === 'false') {
                        throw new Error('solved Image but backend didn\'t accept!');
                    } else {
                        resultMap[k.toString()].foundPair = true;
                        console.log(resultMap);
                    }
                    if (isGameDone(imageResponseB.data)) {
                        console.log('SOLVED!', 'Time:', Date.now() - startTime, 'ms');
                        return;
                    }
                    if (DELAY_BETWEEN_PAIRS) {
                        const delayTime = BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS);
                        await sleep(delayTime);
                    }
                }
            }

            checkI();

            const imageResponse = await clickCard(unsolvedImages[i]);
            const baseId = findImage(imageResponse.base64);
            const baseNum = baseId.replace(/_./g, '');
            const baseChar = baseId.replace(/.*?_/g, '') as 'a'|'b';
            const otherChar = baseChar === 'a' ? 'b' : 'a'

            console.log('found first image', imageResponse, baseId, '\n');
            resultMap[baseNum][baseChar] = unsolvedImages[i];
            unsolvedImages.splice(i, 1);
            if (knowsBoth(baseNum)) {
                if (solved(baseNum)) {
                    // should never happen
                    console.log('We fucked up...');
                    throw new Error('Trying to solve while pair is already solved!');
                }
                console.log(`Knowing pair ${baseNum}... Solving!`);
                if (DELAY_BETWEEN_PAIRS) {
                    const delayTime = BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS);
                    await sleep(delayTime);
                }
                const imageResponse1 = await clickCard(resultMap[baseNum][otherChar] as number);
                console.log('solverResponse:', imageResponse1, `${baseNum}_${otherChar}`, '\n');
                if (imageResponse1.data.newpair === 'false') {
                    throw new Error('solved Image but backend didn\'t accept!');
                } else {
                    resultMap[baseNum].foundPair = true;
                    console.log(resultMap);
                }
                if (isGameDone(imageResponse1.data)) {
                    console.log('SOLVED!', 'Time:', Date.now() - startTime, 'ms');
                    return;
                }
            } else {
                isSecond = true;
            }
            incI();
        } else {
            const imageResponse = await clickCard(unsolvedImages[i]);
            const baseId = findImage(imageResponse.base64);
            const baseNum = baseId.replace(/_./g, '');
            const baseChar = baseId.replace(/.*?_/g, '') as 'a'|'b';

            console.log('found second image', imageResponse, baseId, '\n');

            resultMap[baseNum][baseChar] = unsolvedImages[i];
            unsolvedImages.splice(i, 1)
            if (imageResponse.data.newpair === 'true') { // they don't event send proper json... wtf?!
                if (resultMap[baseNum].foundPair) {
                    // should never happen
                    throw new Error('Found a pair we already solved!');
                }
                console.log(`Solved Pair ${baseNum} by luck!`)
                resultMap[baseNum].foundPair = true;
                console.log(resultMap);
            }

            if (isGameDone(imageResponse.data)) {
                console.log('SOLVED!', 'Time:', Date.now() - startTime, 'ms');
                return;
            }

            isSecond = false;
        }
    }
};