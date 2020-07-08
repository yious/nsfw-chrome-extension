function getAllElements(TagName) {
  let elements = [...document.getElementsByTagName(TagName)];
  return elements;
}

function blurElement(image, text) {
  image.style.filter = "blur(2.5em)";
}

function unblurElement(image) {
  image.style.filter = "";
}

function getMediaSrc(mediaElement) {
  let mediaSrc = mediaElement.src || "";

  switch (mediaElement.nodeName) {
    case "IMG":
      mediaSrc = mediaElement.src
      if (!mediaElement.src) {
        // mediaElement.srcset
        console.warn("enccountered srcset", mediaElement, "not supported yet.");
      } 
      break;
    case "VIDEO":
      /* 
       * Search order is as follows:
       * 1. inner source tag
       * 2. src attribute
       * 3. poster
       */
      let sourceElement = mediaElement.querySelector("source:first-child")
      if (sourceElement) {
        mediaSrc = sourceElement.src;
      } else {
        mediaElement.src ||
        mediaElement.poster;
      }
      break;
    default:
      mediaSrc = mediaElement.src;
      break;
  }  
  return mediaSrc;
}

function sendMessagePromise(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, response => {
        resolve(response);
      });
    }
    catch (error) {
      reject(error);
    }
  });
}

async function isElementSfw(element) {
  // check if src is empty
  let mediaSrcUrl = getMediaSrc(element);
  if (!mediaSrcUrl) {
    return true;
  }

  // check if src is local if so insert the origin
  if (mediaSrcUrl.startsWith("/") && !mediaSrcUrl.startsWith("//")) {
    mediaSrcUrl = document.origin + mediaSrcUrl;
  }

  // call the api
  var message = {
    "type" : element.tagName.toLowerCase(),
    "url" : mediaSrcUrl
  };
  const result = await sendMessagePromise(message);
  return result.isSfw;
}

function toggleLoadingSpinner(element) {
  let parentElement = element.parentElement;
  parentElement.style.position = "";
  let exsitingSpinner = parentElement.querySelector(".chrome-spinner");
  if (exsitingSpinner) {
    exsitingSpinner.remove();
    return;
  }
  let spinner = document.createElement("img");
  spinner.src = chrome.extension.getURL("public/img/loading.svg");
  spinner.style.position = "absolute";
  spinner.style.top = "50%";
  spinner.style.left = "50%";
  spinner.style.height = "50px";
  spinner.style.width = "50px";
  spinner.style.marginLeft = "-25px";
  spinner.style.marginTop = "-25px";
  spinner.classList.add("chrome-spinner");
  parentElement.appendChild(spinner);
}

async function handleElement(mediaElement) {
  blurElement(mediaElement);
  // add loading spinner
  toggleLoadingSpinner(mediaElement)
  let isSfw = await isElementSfw(mediaElement);
  // remove loading spinner
  toggleLoadingSpinner(mediaElement)
  if (isSfw) {
    unblurElement(mediaElement);
  }
}

function main() {
  let observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      let mediaElements = [];
      switch (mutation.type) {
        case "attributes":
        if ((mutation.target.nodeName == "VIDEO" || mutation.target.source == "SOURCE" || mutation.target.nodeName == "IMG") &&
            (mutation.attributeName == "src" || mutation.attributeName == "srcset")) {
              mediaElements = mediaElements.concat(mutation.target);
        }
          break;
        case "childList":
        for (const node of mutation.addedNodes) {
          if (node.getElementsByTagName != undefined) {
            const mediaNodes = [...node.getElementsByTagName("img") || node.getElementsByTagName("video")];
            mediaElements = mediaElements.concat(mediaNodes);
          }
        }
          break;
        default:
          break;
        }

        // call ai for each image
        for (const media of mediaElements) {
          handleElement(media);
        }
    }
    });

    observer.observe(document.body, {
      childList : true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"]

    });
    
    let mediaElements = [...getAllElements("img"), ...getAllElements("video")];
    for (const media of mediaElements) {
      handleElement(media);
    }
  }
  
  window.addEventListener('load', main, false);