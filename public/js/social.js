// social.js - Social functionality for WanderLust

document.addEventListener('DOMContentLoaded', function () {
    console.log('Social features loaded');

    // --- Liking System ---
    const postContainer = document.querySelector('.social-feed-container');
    if (!postContainer) return;

    postContainer.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            const postId = likeBtn.dataset.postId;
            try {
                // Correct path is /api/social/like/:id
                const response = await fetch(`/api/social/like/${postId}`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                });
                const data = await response.json();

                if (data.success) {
                    const heartIcon = likeBtn.querySelector('i');
                    const countSpan = document.querySelector(`#like-count-${postId}`);

                    if (data.liked) {
                        heartIcon.classList.remove('far');
                        heartIcon.classList.add('fas', 'text-danger');
                        heartIcon.style.animation = 'heartBeat 0.4s ease-out';
                    } else {
                        heartIcon.classList.remove('fas', 'text-danger');
                        heartIcon.classList.add('far');
                        heartIcon.style.animation = '';
                    }
                    if (countSpan) countSpan.textContent = data.likeCount;
                }
            } catch (err) {
                console.error('Error liking post:', err);
            }
            return;
        }

        // --- Comment System ---
        const commentForm = e.target.closest('.comment-form');
        if (commentForm) {
            e.preventDefault();
            const postId = commentForm.dataset.postId;
            const input = commentForm.querySelector('input');
            const content = input.value.trim();

            if (!content) return;

            try {
                const response = await fetch(`/social/journal/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ content })
                });
                const data = await response.json();

                if (data.success) {
                    input.value = '';
                    const commentsList = document.querySelector(`#comments-${postId}`);
                    const newComment = createCommentHTML(data.comment);
                    commentsList.insertAdjacentHTML('afterbegin', newComment);

                    // Update counter
                    const counter = document.querySelector(`#comment-count-${postId}`);
                    if (counter) {
                        const currentCount = parseInt(counter.textContent) || 0;
                        counter.textContent = currentCount + 1;
                    }
                }
            } catch (err) {
                console.error('Error posting comment:', err);
            }
            return;
        }

        // --- Delete Post System ---
        const deleteBtn = e.target.closest('.delete-post-btn');
        if (deleteBtn) {
            const postId = deleteBtn.dataset.postId;

            // Premium confirmation (using browser confirm for now, can be upgraded to modal)
            if (confirm('Are you sure you want to delete this adventure? This action cannot be undone.')) {
                try {
                    const response = await fetch(`/social/journal/${postId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                    });
                    const data = await response.json();

                    if (data.success) {
                        const postCard = document.querySelector(`#post-${postId}`);
                        if (postCard) {
                            postCard.style.opacity = '0';
                            postCard.style.transform = 'scale(0.95)';
                            postCard.style.transition = 'all 0.4s ease-out';

                            setTimeout(() => {
                                postCard.remove();
                                // If no posts left, show empty state (optional but nice)
                                if (document.querySelectorAll('.social-post-card').length === 0) {
                                    window.location.reload(); // Refresh to show the premium empty state
                                }
                            }, 400);
                        }
                    } else {
                        alert(data.message || 'Error deleting post');
                    }
                } catch (err) {
                    console.error('Error deleting post:', err);
                    alert('Failed to delete the story. Please try again.');
                }
            }
        }
    });

    function createCommentHTML(comment) {
        return `
            <div class="comment-item mb-2" style="animation: slideIn 0.3s ease-out;">
                <strong>${comment.author.username}</strong>
                <span class="text-secondary ms-1">${comment.content}</span>
                <div class="small text-muted" style="font-size: 10px;">Just now</div>
            </div>
        `;
    }
});
