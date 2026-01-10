document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('imageInput');
    const preview = document.getElementById('uploadPreview');

    if (input && preview) {
        input.addEventListener('change', function (e) {
            preview.innerHTML = ''; // Clear existing
            const files = Array.from(e.target.files);

            if (files.length > 5) {
                alert('Maximum 5 images allowed');
                input.value = ''; // Clear input
                return;
            }

            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;

                const reader = new FileReader();
                reader.onload = function (e) {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    preview.appendChild(div);
                }
                reader.readAsDataURL(file);
            });
        });
    }
});
