let currentSlideIndex = 0;
const vehicleDataElement = document.getElementById('vehicle-data');
const vehicleData = vehicleDataElement ? JSON.parse(vehicleDataElement.textContent) : {};

function openLightbox(index) {
    if (!vehicleData.images || vehicleData.images.length === 0) return;

    currentSlideIndex = index;
    const modal = document.getElementById('lightboxModal');
    const modalImg = document.getElementById('lightboxImage');

    modal.style.display = "flex";
    modal.offsetHeight; // force reflow
    modal.classList.add('show');

    showSlide(currentSlideIndex);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = 'auto'; // Restore scrolling
    }, 300);
}

function changeSlide(n) {
    showSlide(currentSlideIndex += n);
}

function showSlide(n) {
    const images = vehicleData.images;
    if (!images || images.length === 0) return;

    if (n >= images.length) currentSlideIndex = 0;
    if (n < 0) currentSlideIndex = images.length - 1;

    const modalImg = document.getElementById('lightboxImage');

    // Fade out
    modalImg.style.opacity = '0.5';

    setTimeout(() => {
        modalImg.src = images[currentSlideIndex].url;
        // Fade in
        modalImg.style.opacity = '1';
    }, 150);

    // Update counter if exists
    const counter = document.getElementById('lightboxCounter');
    if (counter) {
        counter.textContent = `${currentSlideIndex + 1} / ${images.length}`;
    }
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    if (document.getElementById('lightboxModal').style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') changeSlide(-1);
        if (e.key === 'ArrowRight') changeSlide(1);
    }
});
