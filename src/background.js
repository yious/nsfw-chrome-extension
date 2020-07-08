class ParsingError extends Error {
    constructor(message) {
        super(message)
    }
}

function loadImage(url, elementType) {
    return new Promise((resolve, reject) => {
        let image = document.createElement(elementType);
        image.addEventListener('load', () => {
            resolve(image);
        });
        image.addEventListener('error', () => {
            reject(new ParsingError(`Error loading ${url} as "${elementType}"`));
        })
        image.src = url;
    });
}

class BackgroundProcess
{
    constructor() {
        this.addListeners()
        this.loadModel();
    }

    async loadModel() {
        let model_url = chrome.extension.getURL('public/models/quant_nsfw_mobilenet/');
        this.model = nsfwjs.load(model_url);
    }

    isSfw(predictions) {
        const topPrediction = predictions[0];
        return !(['Porn', 'Sexy'].includes(topPrediction.className) && topPrediction.probability > 0.6);
    }

    async processSource(element) {
        let resolved_model = await this.model;
        let predictions = await resolved_model.classify(element);
        console.log(element.src, predictions);
        return this.isSfw(predictions);
    }

    addListeners() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                (async () => {
                    let isSfw = false;
                    try {
                        let elementTagName = request.type;
                        let element = await loadImage(request.url, elementTagName);
                        isSfw = await this.processSource(element);
                    }
                    catch (error) {
                        if (error instanceof ParsingError) {
                            isSfw = true;
                            console.warn(error);
                        } else {
                            console.error(error);
                        }
                    }
                    sendResponse({isSfw: isSfw});
                })();
            return true;
        });
    }
}

let proc = new BackgroundProcess();