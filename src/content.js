const { image } = require("@tensorflow/tfjs");

function getAllImages() {
  let images = [...document.getElementsByTagName("img")];
}

function main() {
  var images = getAllImages();
  for (const image of images) {
    chrome.runtime.sendMessage({url : image.src});
  }
}

window.addEventListener('load', main, false);