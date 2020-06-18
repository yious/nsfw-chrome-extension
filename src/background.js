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
        this.loadDependencies();
        this.addListeners()
        this.loadModel();
    }

    loadDependencies() {
        
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
        let model_url = chrome.extension.getURL('models/quant_nsfw_mobilenet/');
        console.log(model_url)
        this.model = nsfwjs.load(model_url);
    }

    isSfw(predictions) {
        const topPrediction = predictions[0];
        return !(topPrediction.className in ['Porn', 'Sexy'] && topPrediction.probabilty > 0.6);
    }

    async processSource(url) {
        let image = loadImage(url);
        // await Promise.all(this.model, image);
        let cur_model = await this.model;
        let cur_image = await image;
        console.log(cur_model, cur_image);
        let predictions = await cur_model.classify(cur_image);
        console.log(url, predictions);
        return this.isSfw(predictions);
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