import * as nsfwjs from "nsfwjs"

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
        this.model = this.loadModel();
        this.addListeners()
    }

    addListeners() {
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
              console.log("from a content script:" + sender.tab.url);
              if (request.greeting == "hello")
                sendResponse(processSorce(request.url));
            });
    }

    async loadModel() {
        this.model = nsfwjs.load(MODEL_PATH);
    }

    isSfw(predictions) {
        const topPrediction = predictions[0];
        return !(topPrediction.className in ['Porn', 'Sexy'] && topPrediction.probabilty > 0.6);
    }

    async processSorce(url) {
        let image = loadImage(url);
        await Promise.all(this.model, image);
        let predictions = this.model.classify(image);
        console.log(url, predictions);
        return this.isSfw(predictions);
    }
}

Object.defineProperty(BackgroundProcess, 'MODEL_PATH', {
    value: null,
    writable : false,
    enumerable : true,
    configurable : false
});
BackgroundProcess.MODEL_PATH; 