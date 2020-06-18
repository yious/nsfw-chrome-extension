function getAllImages() {
  let images = [...document.getElementsByTagName("img")];
  return images;
}

function blurImage(image, text) {
  image.style.filter = "blur(2.5em)";
}

function unblurImage(image) {
  image.style.filter = "";
}

function main() {
  let images = getAllImages();
  for (const image of images) {
    blurImage(image);
    chrome.runtime.sendMessage({url : image.src}, (response) => {
      console.log(image.src, response);
      if (response.isSfw === true) {
        unblurImage(image); 
      }
    })
  }
}

window.addEventListener('load', main, false);