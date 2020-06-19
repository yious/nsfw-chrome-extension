function loadImage(url) {
    return new Promise((resolve) => {
        let image = document.createElement("img");
        image.addEventListener('load', () => {
            resolve(image);
        });
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
        let model_url = chrome.extension.getURL('models/quant_nsfw_mobilenet/');
        this.model = nsfwjs.load(model_url);
    }

    isSfw(predictions) {
        const topPrediction = predictions[0];
        return !(['Porn', 'Sexy'].includes(topPrediction.className) && topPrediction.probability > 0.6);
    }

    async processSource(url) {
        let image = await loadImage(url);
        let resolved_model = await this.model;
        let predictions = await resolved_model.classify(image);
        console.log(url, predictions);
        return this.isSfw(predictions);
    }

    addListeners() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                (async () => {
                    const isSfw = await this.processSource(request.url);
                    sendResponse({isSfw: isSfw});
                })();
            return true;
        });
    }
}

Object.defineProperty(BackgroundProcess, 'MODEL_PATH', {
    value: "",
    writable : false,
    enumerable : true,
    configurable : false
});
BackgroundProcess.MODEL_PATH; 

let proc = new BackgroundProcess();