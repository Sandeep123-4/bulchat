/* ============================================================
   Mudraaa Post News - Client JS
   ============================================================ */

(function () {
    "use strict";

    // === Quill Editor Init ===
    const quill = new Quill("#quill-editor", {
        theme: "snow",
        placeholder: "Write your article here...",
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, 4, false] }],
                ["bold", "italic", "underline"],
                ["blockquote"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"]
            ]
        }
    });

    // === DOM Elements ===
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const editingPostId = $("#editingPostId");
    const postTitle = $("#postTitle");
    const postExcerpt = $("#postExcerpt");
    const postTags = $("#postTags");
    const postCategory = $("#postCategory");
    const postFeatured = $("#postFeatured");
    const postShowAuthor = $("#postShowAuthor");
    const featuredInput = $("#featuredInput");
    const featuredPlaceholder = $("#featuredPlaceholder");
    const featuredPreview = $("#featuredPreview");
    const featuredPreviewImg = $("#featuredPreviewImg");
    const featuredRemove = $("#featuredRemove");
    const imagesInput = $("#imagesInput");
    const imagesGrid = $("#imagesGrid");
    const attachInput = $("#attachInput");
    const attachmentsList = $("#attachmentsList");

    const btnSaveDraft = $("#btnSaveDraft");
    const btnPublish = $("#btnPublish");
    const btnPreview = $("#btnPreview");
    const btnCancelEdit = $("#btnCancelEdit");

    const previewModal = $("#previewModal");
    const previewOverlay = $("#previewOverlay");
    const previewClose = $("#previewClose");
    const previewBody = $("#previewBody");

    const postsGrid = $("#postsGrid");
    const postsEmpty = $("#postsEmpty");

    // === State ===
    let featuredFile = null;
    let featuredUploadedPath = "";
    let additionalImages = [];
    let uploadedAttachments = [];

    // === Sidebar Mobile Menu ===
    const sidebarOverlay = $("#sidebarOverlay");
    const mobileMenuBtn = $("#mobileMenuBtn");
    const sidebar = $(".sidebar");

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            sidebarOverlay.classList.toggle("visible");
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.remove("visible");
        });
    }

    // === Theme Toggle ===
    const themeBtn = $("#themeBtn");
    if (themeBtn) {
        const savedTheme = localStorage.getItem("mudraaa-theme");
        if (savedTheme === "light") {
            document.body.classList.add("light-theme");
        }
        themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("light-theme");
            const isLight = document.body.classList.contains("light-theme");
            localStorage.setItem("mudraaa-theme", isLight ? "light" : "dark");
        });
    }

    // === Tab Switching ===
    window.switchTab = function (tabName) {
        $$(".news-tab").forEach(t => t.classList.remove("active"));
        $$(".news-tab-content").forEach(t => t.classList.remove("active"));
        $(`.news-tab[data-tab="${tabName}"]`).classList.add("active");
        $(`#tab-${tabName}`).classList.add("active");

        if (tabName === "posts") {
            loadMyPosts();
        }
    };

    $$(".news-tab").forEach(tab => {
        tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    // === Toast ===
    function showToast(message, type = "info") {
        const container = $("#toastContainer");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // === Featured Image ===
    const featuredUploadArea = $(".featured-upload-area");

    featuredUploadArea.addEventListener("click", (e) => {
        if (e.target.closest(".featured-remove")) return;
        featuredInput.click();
    });

    featuredUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        featuredUploadArea.classList.add("dragover");
    });
    featuredUploadArea.addEventListener("dragleave", () => {
        featuredUploadArea.classList.remove("dragover");
    });
    featuredUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        featuredUploadArea.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleFeaturedSelect(file);
        }
    });

    featuredInput.addEventListener("change", (e) => {
        if (e.target.files[0]) handleFeaturedSelect(e.target.files[0]);
    });

    async function handleFeaturedSelect(file) {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
            showToast("Only JPG, PNG, WEBP images allowed", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must be under 5MB", "error");
            return;
        }

        featuredFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            featuredPreviewImg.src = e.target.result;
            featuredPlaceholder.style.display = "none";
            featuredPreview.style.display = "block";
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch("/api/news/upload/featured", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                featuredUploadedPath = data.file.path;
                showToast("Featured image uploaded", "success");
            } else {
                showToast(data.error || "Upload failed", "error");
                resetFeatured();
            }
        } catch (err) {
            showToast("Upload failed", "error");
            resetFeatured();
        }
    }

    featuredRemove.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (featuredUploadedPath) {
            await fetch("/api/news/delete-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileType: "image", filename: featuredUploadedPath })
            });
        }
        resetFeatured();
    });

    function resetFeatured() {
        featuredFile = null;
        featuredUploadedPath = "";
        featuredInput.value = "";
        featuredPlaceholder.style.display = "flex";
        featuredPreview.style.display = "none";
        featuredPreviewImg.src = "";
    }

    // === Additional Images ===
    imagesInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (additionalImages.length + files.length > 10) {
            showToast("Maximum 10 additional images", "error");
            return;
        }

        for (const file of files) {
            const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowed.includes(file.type)) {
                showToast(`${file.name}: only JPG, PNG, WEBP allowed`, "error");
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name}: must be under 5MB`, "error");
                continue;
            }
        }

        const formData = new FormData();
        files.forEach(f => {
            const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (allowed.includes(f.type) && f.size <= 5 * 1024 * 1024) {
                formData.append("images", f);
            }
        });

        if (!formData.has("images")) {
            imagesInput.value = "";
            return;
        }

        try {
            const res = await fetch("/api/news/upload/images", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                additionalImages.push(...data.files);
                renderImages();
                showToast(`${data.files.length} image(s) uploaded`, "success");
            } else {
                showToast(data.error || "Upload failed", "error");
            }
        } catch (err) {
            showToast("Upload failed", "error");
        }

        imagesInput.value = "";
    });

    function renderImages() {
        imagesGrid.innerHTML = "";
        additionalImages.forEach((img, idx) => {
            const div = document.createElement("div");
            div.className = "image-thumb";
            div.innerHTML = `
                <img src="${img.path}" alt="${img.originalName}">
                <button class="image-remove" data-idx="${idx}" title="Remove">&times;</button>
            `;
            div.querySelector(".image-remove").addEventListener("click", async () => {
                await fetch("/api/news/delete-file", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileType: "image", filename: img.filename })
                });
                additionalImages.splice(idx, 1);
                renderImages();
            });
            imagesGrid.appendChild(div);
        });
    }

    // === Attachments ===
    attachInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (uploadedAttachments.length + files.length > 5) {
            showToast("Maximum 5 attachments", "error");
            return;
        }

        const blockedExt = [".exe", ".bat", ".cmd", ".sh", ".php", ".msi", ".js", ".ps1", ".vbs", ".com", ".scr", ".pif", ".jar", ".wsf", ".cpl"];
        const validFiles = [];
        for (const file of files) {
            const ext = "." + file.name.split(".").pop().toLowerCase();
            if (blockedExt.includes(ext)) {
                showToast(`${file.name}: file type not allowed`, "error");
                continue;
            }
            if (file.size > 20 * 1024 * 1024) {
                showToast(`${file.name}: must be under 20MB`, "error");
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            attachInput.value = "";
            return;
        }

        const formData = new FormData();
        validFiles.forEach(f => formData.append("attachments", f));

        try {
            const res = await fetch("/api/news/upload/attachments", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                uploadedAttachments.push(...data.files);
                renderAttachments();
                showToast(`${data.files.length} file(s) attached`, "success");
            } else {
                showToast(data.error || "Upload failed", "error");
            }
        } catch (err) {
            showToast("Upload failed", "error");
        }

        attachInput.value = "";
    });

    function renderAttachments() {
        attachmentsList.innerHTML = "";
        uploadedAttachments.forEach((att, idx) => {
            const ext = att.originalName.split(".").pop().toUpperCase();
            const size = formatSize(att.size);
            const div = document.createElement("div");
            div.className = "attachment-item";
            div.innerHTML = `
                <div class="attachment-icon">${ext.substring(0, 4)}</div>
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHtml(att.originalName)}</div>
                    <div class="attachment-meta">${ext} &middot; ${size}</div>
                </div>
                <button class="attachment-remove" data-idx="${idx}" title="Remove">&times;</button>
            `;
            div.querySelector(".attachment-remove").addEventListener("click", async () => {
                await fetch("/api/news/delete-file", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileType: "attachment", filename: att.filename })
                });
                uploadedAttachments.splice(idx, 1);
                renderAttachments();
            });
            attachmentsList.appendChild(div);
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // === Save Post ===
    async function savePost(status) {
        const title = postTitle.value.trim();
        if (!title) {
            showToast("Title is required", "error");
            postTitle.focus();
            return;
        }

        const content = quill.root.innerHTML;
        const postId = editingPostId.value || "";

        const body = {
            postId,
            title,
            excerpt: postExcerpt.value.trim(),
            content,
            category: postCategory.value,
            tags: postTags.value,
            status,
            featuredImage: featuredUploadedPath,
            images: additionalImages,
            attachments: uploadedAttachments,
            featured: postFeatured.checked,
            showAuthor: postShowAuthor.checked
        };

        try {
            const res = await fetch("/api/news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                showToast(status === "published" ? "Post published!" : "Draft saved!", "success");

                if (editingPostId.value) {
                    editingPostId.value = "";
                    btnCancelEdit.style.display = "none";
                    $("#pageTitle").textContent = "Post News";
                    $("#pageSubtitle").textContent = "Write and publish your articles";
                }

                clearEditor();
            } else {
                showToast(data.error || "Failed to save", "error");
            }
        } catch (err) {
            showToast("Failed to save post", "error");
        }
    }

    btnSaveDraft.addEventListener("click", () => savePost("draft"));
    btnPublish.addEventListener("click", () => savePost("published"));

    function clearEditor() {
        postTitle.value = "";
        postExcerpt.value = "";
        postTags.value = "";
        postCategory.value = "General";
        postFeatured.checked = false;
        postShowAuthor.checked = false;
        quill.setContents([]);
        resetFeatured();
        additionalImages = [];
        uploadedAttachments = [];
        renderImages();
        renderAttachments();
    }

    // === Cancel Edit ===
    btnCancelEdit.addEventListener("click", () => {
        editingPostId.value = "";
        btnCancelEdit.style.display = "none";
        $("#pageTitle").textContent = "Post News";
        $("#pageSubtitle").textContent = "Write and publish your articles";
        clearEditor();
    });

    // === Load My Posts ===
    async function loadMyPosts(filter = "all") {
        postsGrid.innerHTML = `<div class="posts-loading"><div class="spinner"></div><span>Loading posts...</span></div>`;
        postsEmpty.style.display = "none";

        try {
            const res = await fetch(`/api/news/mine?filter=${filter}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            if (data.posts.length === 0) {
                postsGrid.innerHTML = "";
                postsEmpty.style.display = "block";
                return;
            }

            postsEmpty.style.display = "none";
            postsGrid.innerHTML = "";

            data.posts.forEach(post => {
                const card = document.createElement("div");
                card.className = "post-card";

                const date = new Date(post.updatedAt || post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                });

                const imageHtml = post.featuredImage
                    ? `<img class="post-card-image" src="${post.featuredImage}" alt="">`
                    : `<div class="post-card-image-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;

                card.innerHTML = `
                    ${imageHtml}
                    <div class="post-card-body">
                        <span class="post-card-status ${post.status}">${post.status}</span>
                        ${post.featured ? '<span class="post-card-status published" style="background:rgba(234,179,8,0.12);color:#eab308;">Featured</span>' : ''}
                        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
                        <p class="post-card-excerpt">${escapeHtml(post.excerpt || "")}</p>
                        <div class="post-card-meta">
                            <span class="post-card-category">${escapeHtml(post.category)}</span>
                            <span>${date}</span>
                        </div>
                        <div class="post-card-actions">
                            <button class="btn btn-outline btn-edit" data-id="${post._id}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                Edit
                            </button>
                            <button class="btn btn-danger btn-delete" data-id="${post._id}" data-title="${escapeHtml(post.title)}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete
                            </button>
                        </div>
                    </div>
                `;

                card.querySelector(".btn-edit").addEventListener("click", () => editPost(post._id));
                card.querySelector(".btn-delete").addEventListener("click", () => deletePost(post._id, post.title));

                postsGrid.appendChild(card);
            });
        } catch (err) {
            postsGrid.innerHTML = `<div class="posts-loading" style="color:var(--d-text-muted);">Failed to load posts</div>`;
        }
    }

    // === Edit Post ===
    async function editPost(postId) {
        try {
            const res = await fetch(`/api/news/${postId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const post = data.post;

            editingPostId.value = post._id;
            postTitle.value = post.title || "";
            postExcerpt.value = post.excerpt || "";
            postCategory.value = post.category || "General";
            postTags.value = (post.tags || []).join(", ");
            postFeatured.checked = !!post.featured;
            postShowAuthor.checked = !!post.showAuthor;
            quill.root.innerHTML = post.content || "";

            if (post.featuredImage) {
                featuredUploadedPath = post.featuredImage;
                featuredPreviewImg.src = post.featuredImage;
                featuredPlaceholder.style.display = "none";
                featuredPreview.style.display = "block";
            }

            additionalImages = post.images || [];
            renderImages();

            uploadedAttachments = post.attachments || [];
            renderAttachments();

            btnCancelEdit.style.display = "flex";
            $("#pageTitle").textContent = "Edit Post";
            $("#pageSubtitle").textContent = "Update your article";

            switchTab("editor");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            showToast("Failed to load post", "error");
        }
    }

    // === Delete Post ===
    async function deletePost(postId, title) {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/news/${postId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("Post deleted", "success");
                loadMyPosts(getCurrentFilter());
            } else {
                showToast(data.error || "Delete failed", "error");
            }
        } catch (err) {
            showToast("Failed to delete post", "error");
        }
    }

    // === Filter Posts ===
    function getCurrentFilter() {
        const active = $(".filter-btn.active");
        return active ? active.dataset.filter : "all";
    }

    $$(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            $$(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            loadMyPosts(btn.dataset.filter);
        });
    });

    // === Preview ===
    btnPreview.addEventListener("click", () => {
        const title = postTitle.value.trim() || "Untitled";
        const excerpt = postExcerpt.value.trim();
        const content = quill.root.innerHTML;
        const category = postCategory.value;
        const tags = postTags.value.split(",").map(t => t.trim()).filter(Boolean);

        let html = `<h1 class="preview-title">${escapeHtml(title)}</h1>`;

        if (excerpt) {
            html += `<div class="preview-excerpt">${escapeHtml(excerpt)}</div>`;
        }

        html += `<div class="preview-meta">`;
        html += `<span>${escapeHtml(category)}</span>`;
        if (tags.length) {
            html += `<span>${tags.map(t => escapeHtml(t)).join(", ")}</span>`;
        }
        html += `<span>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>`;
        html += `</div>`;

        if (featuredUploadedPath) {
            html += `<img class="preview-featured" src="${featuredUploadedPath}" alt="Featured">`;
        }

        if (content && content !== "<p><br></p>") {
            html += `<div class="preview-content">${content}</div>`;
        }

        if (uploadedAttachments.length > 0) {
            html += `<div class="preview-attachments"><h4>Attachments</h4>`;
            uploadedAttachments.forEach(att => {
                html += `<div class="attachment-item" style="margin-bottom:8px">
                    <div class="attachment-icon">${att.originalName.split(".").pop().toUpperCase().substring(0, 4)}</div>
                    <div class="attachment-info">
                        <div class="attachment-name">${escapeHtml(att.originalName)}</div>
                        <div class="attachment-meta">${formatSize(att.size)}</div>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        previewBody.innerHTML = html;
        previewModal.classList.add("active");
        document.body.style.overflow = "hidden";
    });

    function closePreview() {
        previewModal.classList.remove("active");
        document.body.style.overflow = "";
    }

    previewClose.addEventListener("click", closePreview);
    previewOverlay.addEventListener("click", closePreview);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && previewModal.classList.contains("active")) {
            closePreview();
        }
    });

    // === Load initial posts count ===
    loadMyPosts();

})();
