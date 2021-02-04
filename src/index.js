
const cookieParser = require('cookie');
const http = require('superagent');
const fs = require('fs');
const sharp = require('sharp');
const looksSame = require('looks-same');


const FAST_COMPARE = true;
const COMPARE_DELAY = true;

const BASE_DELAY_MS = 2000;
const ADD_DELAY_MAX_MS = 2000;

const DELAY_BETWEEN_PAIRS = true;
const HALF_DELAY_ON_SOLVE = true;

const cookieString = '';

const BASELINE_IMAGES_DIR = './baselineImages';

const BASE_URL = 'https://matchup.hitech-gamer.com';
const ENDPOINTS = {
    START: '/game/start',
    IMAGE: '/game/do/image',
    IMAGE_DOWNLOAD: '/game/image/'
}

const BASELINE_IMGS = [];

const withHeaders = async (req, cookie) => {
    const stackTrace = new Error().stack;
    return req.set('Cookie', serializeCookie(cookie))
    .set('Host', 'matchup.hitech-gamer.com')
    .set('Referer', 'https://matchup.hitech-gamer.com/game/start')
    .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36')
    .set('X-Requested-With', 'XMLHttpRequest').catch((e) => {
        console.log('Error when requesting url:', req.url, 'Stack:', stackTrace);
        throw e;
    })
};
    ;

const serializeCookie = (cookie) => 
    Object.entries(cookie).reduce(
        (res, [key, value]) => `${cookieParser.serialize(key, value)}; ${res}`, ''
    ).replace(/; $/g, '');


const getImageResponse = async (idx, gameId, cookie) => {
    if (!idx) {
        throw new Error('getImageResponse: idx not set');
    }
    if (!gameId) {
        throw new Error('getImageResponse: gameId not set');
    }
    if (!cookie) {
        throw new Error('getImageResponse: cookie not set');
    }
    return JSON.parse((await withHeaders(http.get(`${BASE_URL}${ENDPOINTS.IMAGE}`).query({
        id: gameId,
        clicked: idx
    }), cookie)).text);
} 

const loadImage = async (imageID, cookie) => {
    return (await withHeaders(http.get(`${BASE_URL}${ENDPOINTS.IMAGE_DOWNLOAD}${imageID}`), cookie)).body;
}

const downloadImageByIndex = async (idx, gameId, cookie) => {
    const imageReponse = await getImageResponse(idx, gameId, cookie);
    return loadImage(imageReponse.image, cookie);
}

const imageToPng = async (buffer) => sharp(buffer).png().toBuffer();

// download Images; used on first launch to get baseline for pair matching
const downloadImages = async (gameId, cookie) => {
    if (!fs.existsSync(BASELINE_IMAGES_DIR)) {
        fs.mkdirSync(BASELINE_IMAGES_DIR);
    }
    await Promise.all(new Array(32).fill().map(async (e,idx) => {
        const image = downloadImageByIndex(idx, gameId, cookie);
        fs.writeFileSync(`${BASELINE_IMAGES_DIR}/${idx}.jpg`, image);
    }));
    console.log('baseline images downloaded. order by pairs and restart');
    // make damn sure process exits...
    process.exit(0);
};


// re-write cookie string, to not be a too obvious bot 🤣
const rewriteSelfWithCookie = (cookie) => {
    const ownFile = fs.readFileSync(process.argv[1]);
    fs.writeFileSync(
        process.argv[1],
        ownFile.toString().replace(/const cookieString = '(.*)?';/, `const cookieString = '${serializeCookie(cookie)}';`)
    );
}

const sleep = async (delay) => new Promise((resolve) => setTimeout(() => resolve(), delay ? delay : 10000));

const fillBaselineImgs = async () => {
    await Promise.all(new Array(16).fill().map(async (e, idx) => {
        const [a, b] = await Promise.all([
            sharp(fs.readFileSync(`${BASELINE_IMAGES_DIR}/${idx}_a.jpg`)).png().toBuffer(),
            sharp(fs.readFileSync(`${BASELINE_IMAGES_DIR}/${idx}_b.jpg`)).png().toBuffer()
        ]);
        BASELINE_IMGS.push({a, b});
    }));
}; 

const isSameImage = async (a, b) => {
    return new Promise((resolve, reject) =>
        looksSame(
            a,
            b,
            { tolerance: 1, stopOnFirstFail: FAST_COMPARE },
            (err, res) => err ? reject(err) : resolve(res.equal)    
    ));
};

const findImage = async (imgBuff) => {
    const imgCode = (await Promise.all(BASELINE_IMGS.map(async ({a, b}, idx) => {
        const [isA, isB] = await Promise.all([
            isSameImage(imgBuff, a),
            isSameImage(imgBuff, b),
        ]);
        return isA ? `${idx}_a` : isB ? `${idx}_b` : undefined;
    }))).filter((e) => e !== undefined);
    if (COMPARE_DELAY) {
        await sleep(BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS));
    }
    return imgCode?.[0];
};

const isGameDone = (response) => {
    if (response.cancel === 'true') {
        throw new Error('Shit! We\'ve been detected!');
    };
    return response.done === 'true';
}

const main = async () => {

    await fillBaselineImgs();

    // const test = await isSameImage(BASELINE_IMGS[15].b, BASELINE_IMGS[15].b);
    // console.log(test);

    // const startTime = Date.now();
    // const bla = await findImage(BASELINE_IMGS[2].b);
    // console.log(bla, 'time: ', Date.now() - startTime);
    // return;

    const cookie = cookieParser.parse(cookieString);

    const startPage = await withHeaders(http.get(`${BASE_URL}${ENDPOINTS.START}`), cookie);
    if (startPage.headers['set-cookie']?.length > 0)
        Object.assign(cookie, cookieParser.parse(startPage.headers['set-cookie'].join('; ')));
    
    rewriteSelfWithCookie(cookie);

    const gameId = (/<input type="hidden" id="id" value="(.*)?"/g).exec(startPage.text)?.[1];
    if (!gameId) {
        throw new Error('Couldn\'t get gameId. Cookie invalid?');
    }
    
    if (!fs.existsSync(BASELINE_IMAGES_DIR)) {
        await downloadImages(gameId, cookie);
        return;
    }

    // await sleep(20000);

    const resultMap = [...Array(16).keys()].reduce((res, curr) => {
        res[curr.toString()] = {
            a: undefined,
            b: undefined,
            foundPair: false
        };
        return res;
    }, {});


    const knowsBoth = (baseIdNum) => resultMap[baseIdNum].a !== undefined && resultMap[baseIdNum].b !== undefined;
    const solved = (baseIdNum) => resultMap[baseIdNum].foundPair;

    let unsolvedImages = [...Array(32).keys()].sort(() => 0.5 - Math.random())
    let i = 0;
    let isSecond = false;

    const incI = () => {
        i++;
        if (i >= unsolvedImages.length) {
            i = 0;
            unsolvedImages = [...unsolvedImages].sort(() => 0.5 - Math.random())
        }
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
                    const imageResponseA = await getImageResponse(v.a, gameId, cookie);
                    console.log('imageResponse A', imageResponseA, `${k}_a`, '\n');
                    // don't download image again, we have it already...
                    // const imageAsPng1 = await imageToPng(await loadImage(imageResponse1.image, cookie));
                    // TODO: Check what the website does.
                    if (DELAY_BETWEEN_PAIRS) {
                        const delayTime = BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS);
                        await sleep(HALF_DELAY_ON_SOLVE ? delayTime / 2 : delayTime);
                    }
                    const imageResponseB = await getImageResponse(v.b, gameId, cookie);
                    console.log('imageResponse B', imageResponseB, `${k}_b`, '\n');
                    // don't download image again, we have it already...
                    // const imageAsPng1 = await imageToPng(await loadImage(imageResponse1.image, cookie));
                    // TODO: Check what the website does.
                    if (imageResponseB.newpair === 'false') {
                        throw new Error('solved Image but backend didn\'t accept!');
                    } else {
                        resultMap[k.toString()].foundPair = true;
                        console.log(resultMap);
                    }
                    if (isGameDone(imageResponseB)) {
                        console.log('SOLVED!', 'Time:', Date.now() - startTime, 'ms');
                        return;
                    }
                    if (DELAY_BETWEEN_PAIRS) {
                        const delayTime = BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS);
                        await sleep(HALF_DELAY_ON_SOLVE ? delayTime / 2 : delayTime);
                    }
                }
            }

            const imageResponse = await getImageResponse(unsolvedImages[i], gameId, cookie);
            const imageAsPng = await imageToPng(await loadImage(imageResponse.image, cookie));
            const baseId = await findImage(imageAsPng);
            const baseNum = baseId.replace(/_./g, '');
            const baseChar = baseId.replace(/.*?_/g, '');
            const otherChar = baseChar === 'a' ? 'b' : 'a'
    
            console.log('found first image', imageResponse, baseId, '\n');

            resultMap[baseNum][baseChar] = unsolvedImages[i];
            unsolvedImages.splice(i, 1)
            if (knowsBoth(baseNum)) {
                if (solved(baseNum)) {
                    // should never happen
                    console.log('We fucked up...');
                    throw new Error('Trying to solve while pair is already solved!');
                }
                console.log(`Knowing pair ${baseNum}... Solving!`);
                if (DELAY_BETWEEN_PAIRS) {
                    const delayTime = BASE_DELAY_MS + Math.round(Math.random() * ADD_DELAY_MAX_MS);
                    await sleep(HALF_DELAY_ON_SOLVE ? delayTime / 2 : delayTime);
                }
                const imageResponse1 = await getImageResponse(resultMap[baseNum][otherChar], gameId, cookie);
                // don't download image again, we have it already...
                // const imageAsPng1 = await imageToPng(await loadImage(imageResponse1.image, cookie));
                // TODO: Check what the website does.
                console.log('solverResponse:', imageResponse1, `${baseNum}_${otherChar}`, '\n');
                if (imageResponse1.newpair === 'false') {
                    throw new Error('solved Image but backend didn\'t accept!');
                } else {
                    resultMap[baseNum].foundPair = true;
                    console.log(resultMap);
                }
                if (isGameDone(imageResponse1)) {
                    console.log('SOLVED!', 'Time:', Date.now() - startTime, 'ms');
                    return;
                }
            } else {
                isSecond = true;
            }
            incI();
        } else {
            const imageResponse = await getImageResponse(unsolvedImages[i], gameId, cookie);
            const imageAsPng = await imageToPng(await loadImage(imageResponse.image, cookie));
            const baseId = await findImage(imageAsPng);
            const baseNum = baseId.replace(/_./g, '');
            const baseChar = baseId.replace(/.*?_/g, '');

            console.log('found second image', imageResponse, baseId, '\n');

            resultMap[baseNum][baseChar] = unsolvedImages[i];
            unsolvedImages.splice(i, 1)
            if (imageResponse.newpair === 'true') { // they don't event send proper json... wtf?!
                if (resultMap[baseNum].foundPair) {
                    // should never happen
                    throw new Error('Found a pair we already solved!');
                }
                console.log(`Solved Pair ${baseNum} by luck!`)
                resultMap[baseNum].foundPair = true;
                console.log(resultMap);
            }

            if (isGameDone(imageResponse)) {
                console.log('SOLVED!', 'Time:', Date.now() - startTime, 'ms');
                return;
            }

            isSecond = false;
        }
    }
    console.log('something isn\'t right...');
};

void main();
