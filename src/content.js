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

function handleImage(imageElement) {
  blurImage(imageElement);
  chrome.runtime.sendMessage({url : imageElement.src}, (response) => {
    console.log(imageElement, response.isSfw);
    if (response.isSfw === true) {
      unblurImage(imageElement);
    }
  });
}

function main() {
  let observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // extract images from mutations
      let newImages = [];
      for (const node of mutation.addedNodes) {
        if (node.getElementsByTagName != undefined) {
          const imagesInNode = [...node.getElementsByTagName("img")];
          newImages = newImages.concat(imagesInNode);
        }
      }

      // call ai for each image
      for (const image of newImages) {
        handleImage(image);
      }
    }
  });
  observer.observe(document.body, {
    childList : true,
    subtree: true
  });
  
  let images = getAllImages();
  for (const image of images) {
    handleImage(image);
  }
}

window.addEventListener('load', main, false);