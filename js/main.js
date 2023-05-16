let currentThumb = null;

function getAddedMarginWidth(el) {
  let marginLeft = window
    .getComputedStyle(el)
    .getPropertyValue("margin-left")
    .replace("px", "");
  let marginRight = window
    .getComputedStyle(el)
    .getPropertyValue("margin-right")
    .replace("px", "");
  return parseInt(marginLeft) + parseInt(marginRight);
}

function getAspectRatio(el) {
  return el.naturalWidth / el.naturalHeight;
}

function registerKeyEvents() {
  const overlayContainer = document.getElementById("overlay");
  // When the user presses the escape key, remove the overlay container
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      overlayContainer.style.display = "none";
    }

    if (event.key === "ArrowRight") {
      if (!currentThumb) {
        return;
      }
      const nextImage = currentThumb.nextElementSibling;
      if (nextImage) {
        expandThumbnail(nextImage);
      }
    }

    if (event.key === "ArrowLeft") {
      if (!currentThumb) {
        return;
      }
      const nextImage = currentThumb.previousElementSibling;
      if (nextImage) {
        expandThumbnail(nextImage);
      }
    }
  });
}

function expandThumbnail(thumbnail) {
  currentThumb = thumbnail;
  let overlayContainer = document.getElementById("overlay");

  // Create a larger image element
  const largeImage = document.createElement("img");
  const thumbnailSrc = thumbnail.src;
  const largeSrc = thumbnailSrc.replace("_small.jpg", ".jpg");
  largeImage.src = largeSrc;

  // Append the larger image to the overlay container
  overlayContainer.innerHTML = "";
  overlayContainer.appendChild(largeImage);
}

function enableImagePopup(thumbnailContainer) {
  const thumbnails = thumbnailContainer.querySelectorAll("img");
  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      let overlayContainer = document.getElementById("overlay");
      if (!overlayContainer) {
        overlayContainer = document.createElement("div");
        overlayContainer.id = "overlay";
        document.querySelector("body").prepend(overlayContainer);

        overlayContainer.addEventListener("click", (event) => {
          overlayContainer.style.display = "none";
        });
        registerKeyEvents();
      }

      overlayContainer.style.display = "flex";
      expandThumbnail(thumbnail);
    });
  });
}

function resizeImagesToEvenGrid(container) {
  const imgs = container.getElementsByTagName("img");
  const MARGIN_WIDTH = getAddedMarginWidth(imgs[0]);
  const MINIMUM_ROW_HEIGHT = 200;

  let totalWidth = 0;
  let rowImages = [];

  for (let i = 0; i < imgs.length; i++) {
    let img = imgs[i];
    let width = getAspectRatio(img) * MINIMUM_ROW_HEIGHT;
    let marginWidth = MARGIN_WIDTH * rowImages.length;

    // If adding this image would make the total width too large, adjust the row height and finalize the row.
    if (
      totalWidth + width + marginWidth + MARGIN_WIDTH >
      container.offsetWidth
    ) {
      // Adjust the row height to fit within the container.
      const rowHeight =
        ((container.offsetWidth - marginWidth) / totalWidth) *
        MINIMUM_ROW_HEIGHT;

      for (let j = 0; j < rowImages.length; j++) {
        rowImages[j].style.width =
          getAspectRatio(rowImages[j]) * rowHeight + "px";
        rowImages[j].style.height = rowHeight + "px";
      }

      // Start a new row.
      totalWidth = width;
      rowImages = [img];
    } else {
      totalWidth += width;
      rowImages.push(img);
    }
  }

  // Handle the last row of images.
  if (rowImages.length > 0) {
    let marginWidth = MARGIN_WIDTH * rowImages.length;
    const rowHeight =
      ((container.offsetWidth - marginWidth) / totalWidth) * MINIMUM_ROW_HEIGHT;

    for (let j = 0; j < rowImages.length; j++) {
      rowImages[j].style.width =
        getAspectRatio(rowImages[j]) * rowHeight + "px";
      rowImages[j].style.height = rowHeight + "px";
    }
  }
}

window.addEventListener("load", () => {
  const container = document.querySelector(".image-list");
  resizeImagesToEvenGrid(container);
  enableImagePopup(container);
});
