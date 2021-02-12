import { fetchBase64Image } from './utils';
import { newGetImage } from './newGetImage';

export interface ImageData {
    cancel: 'true'|'false';
    checks: unknown[];
    default: string;
    done: 'true'|'false';
    id: string;
    newpair: 'true'|'false';
    image: string;
    number: string;
    pair: unknown[];
    reset: unknown[];
}

export type ImageCallback = (number: number, data: ImageData, base64: string) => void|Promise<void>;

const callbackList: ImageCallback[] = [];

export const addImageCallback = (fn: ImageCallback): void => {
    callbackList.push(fn);
};

const imageCache: { [K in string]: string } = {};

Object.assign(window, {
    getImageHook: async (number: number, data: ImageData) => {
        // old logic we've replaced
        if (!imageCache[data.image]) {
            imageCache[data.image] = await fetchBase64Image(`/game/image/${data.image}`);
        }
        const image = document.querySelector(`#card${number}`) as HTMLImageElement;
        const middleImage = document.querySelector('#middle-image') as HTMLImageElement;
        image.src = imageCache[data.image];
        middleImage.src = imageCache[data.image];
        // \
        // call all registered callbacks
        callbackList.forEach((fn) => void fn(number, data, imageCache[data.image].replace(/^data:image\/(png|jpg);base64,/, '')));
    },
});

// hook game Functions...
// eslint-disable-next-line
window.getImage = newGetImage;
// \
