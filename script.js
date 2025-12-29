document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       MOBILE MENU TOGGLE
       ========================================= */
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    /* =========================================
       FAQ ACCORDION
       ========================================= */
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all others
            faqItems.forEach(other => {
                other.classList.remove('active');
                other.querySelector('.faq-answer').style.maxHeight = null;
            });
            
            // Toggle current
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    /* =========================================
       MODAL LOGIC
       ========================================= */
    const openButtons = document.querySelectorAll('[data-modal-target]');
    const closeButtons = document.querySelectorAll('[data-modal-close]');
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId + '-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId + '-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    openButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(btn.getAttribute('data-modal-target'));
        });
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.getAttribute('data-modal-close'));
        });
    });
    
    // Close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });

    /* =========================================
       PLAYGROUND LOGIC (API WIRED)
       ========================================= */
    const DEBUG = false; // Set to true for debugging logs

    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const previewImage = document.getElementById('preview-image');
    const uploadContent = document.querySelector('.upload-content');
    
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    const resultPlaceholder = document.getElementById('result-placeholder');
    const loadingState = document.getElementById('loading-state');
    const resultFinal = document.getElementById('result-final');
    
    // --- STATE MANAGEMENT ---
    let currentUploadedUrl = null;
    const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2';
    
    // --- UI HELPERS ---
    
    function showLoading() {
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');
        if (resultFinal) resultFinal.classList.add('hidden');
        if (loadingState) loadingState.classList.remove('hidden');
    }

    function hideLoading() {
        if (loadingState) loadingState.classList.add('hidden');
    }

    function updateStatus(text) {
        // Try to update text inside loading state if it exists
        const loadingText = loadingState.querySelector('p') || loadingState.querySelector('span');
        if (loadingText) loadingText.textContent = text;
        
        // Also update button text if it's currently processing
        if (generateBtn && generateBtn.disabled) {
            generateBtn.textContent = text;
        }
    }

    function showError(message) {
        if (DEBUG) console.error(message);
        alert('Error: ' + message);
        hideLoading();
        if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Clownify Me!';
        }
    }

    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
        }
        if (uploadContent) {
            uploadContent.classList.add('hidden');
        }
    }

    function enableGenerateButton() {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Clownify Me!';
        }
        if (resetBtn) {
            resetBtn.disabled = false;
        }
    }
    
    function showResultMedia(url) {
        if (resultFinal) {
            resultFinal.crossOrigin = 'anonymous'; // Critical for canvas fallback
            resultFinal.src = url;
            resultFinal.classList.remove('hidden');
        }
    }
    
    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.disabled = false;
            downloadBtn.style.display = 'inline-block';
        }
    }

    // --- API FUNCTIONS ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Upload file to CDN storage (called immediately when file is selected)
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        const fileName = 'media/' + uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL from API
        const signedUrlResponse = await fetch(
            'https://core.faceswapper.ai/media/get-upload-url?fileName=' + encodeURIComponent(fileName) + '&projectId=dressr',
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        if (DEBUG) console.log('Got signed URL');
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://assets.dressr.ai/' + fileName;
        if (DEBUG) console.log('Uploaded to:', downloadUrl);
        return downloadUrl;
    }

    // Submit generation job
    async function submitImageGenJob(imageUrl) {
        const endpoint = 'https://api.chromastudio.ai/image-gen';
        
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        const body = {
            model: 'image-effects',
            toolType: 'image-effects',
            effectId: 'pokemonTrainer',
            imageUrl: imageUrl,
            userId: USER_ID,
            removeWatermark: true,
            isPrivate: true
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        if (DEBUG) console.log('Job submitted:', data.jobId, 'Status:', data.status);
        return data;
    }

    // Poll job status until completed or failed
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_POLLS = 60; // Max 2 minutes of polling

    async function pollJobStatus(jobId) {
        const baseUrl = 'https://api.chromastudio.ai/image-gen';
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            if (DEBUG) console.log('Poll', polls + 1, '- Status:', data.status);
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            // Update UI with progress
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out after ' + MAX_POLLS + ' polls');
    }

    // --- EVENT HANDLERS ---

    async function handleFileSelect(file) {
        try {
            // Show temporary loading or status in button
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Uploading...';
            }
            
            // Upload immediately
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Update UI
            showPreview(uploadedUrl);
            enableGenerateButton();
            
        } catch (error) {
            showError(error.message);
        }
    }

    async function handleGenerate() {
        if (!currentUploadedUrl) return;
        
        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');
            
            // Disable buttons during process
            if (generateBtn) generateBtn.disabled = true;
            if (resetBtn) resetBtn.disabled = true;
            
            // Step 1: Submit job
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            updateStatus('JOB QUEUED...');
            
            // Step 2: Poll for completion
            const result = await pollJobStatus(jobData.jobId);
            
            // Step 3: Extract result URL
            // Schema check: result.result can be object (new) or array (old)
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.image;
            
            if (!resultUrl) {
                throw new Error('No image URL in response');
            }
            
            if (DEBUG) console.log('Result image URL:', resultUrl);
            
            // Step 4: Display result
            showResultMedia(resultUrl);
            showDownloadButton(resultUrl);
            
            hideLoading();
            
            // Reset UI states
            if (generateBtn) {
                generateBtn.textContent = 'Clownify Me!';
                generateBtn.disabled = false;
            }
            if (resetBtn) resetBtn.disabled = false;
            
        } catch (error) {
            showError(error.message);
        }
    }

    // File Input Listeners
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
    
    // Drag & Drop Listeners
    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }
    
    // Generate Button Listener
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }
    
    // Reset Button Listener
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            if (fileInput) fileInput.value = '';
            
            if (previewImage) {
                previewImage.classList.add('hidden');
                previewImage.src = '';
            }
            if (uploadContent) {
                uploadContent.classList.remove('hidden');
            }
            if (resultFinal) {
                resultFinal.classList.add('hidden');
                resultFinal.src = '';
            }
            if (resultPlaceholder) {
                resultPlaceholder.classList.remove('hidden');
            }
            if (loadingState) {
                loadingState.classList.add('hidden');
            }
            
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Clownify Me!';
            }
            if (resetBtn) resetBtn.disabled = true;
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.removeAttribute('data-url');
            }
        });
    }
    
    // Download Button Listener (Fetch + Blob approach with Canvas Fallback)
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            
            try {
                // Fetch the file as a blob - forces download
                const response = await fetch(url, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch file: ' + response.statusText);
                }
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Determine file extension
                const contentType = response.headers.get('content-type') || '';
                let extension = 'jpg';
                if (contentType.includes('png') || url.match(/\.png/i)) {
                    extension = 'png';
                } else if (contentType.includes('webp') || url.match(/\.webp/i)) {
                    extension = 'webp';
                }
                
                // Create download link
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'jokerfilter_' + generateNanoId(8) + '.' + extension;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                
            } catch (err) {
                if (DEBUG) console.error('Download error:', err);
                // Fallback: Try canvas approach
                try {
                    const img = document.getElementById('result-final');
                    if (img && img.complete && img.naturalWidth > 0) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = 'jokerfilter_' + generateNanoId(8) + '.png';
                                link.click();
                                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                            } else {
                                alert('Download failed. Right-click the image and select "Save image as..." to download.');
                            }
                        }, 'image/png');
                        return;
                    }
                } catch (canvasErr) {
                    if (DEBUG) console.error('Canvas fallback error:', canvasErr);
                }
                
                // Final fallback
                alert('Direct download failed. The file will open in a new tab.\nRight-click and select "Save as..." to download.');
                window.open(url, '_blank');
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        });
    }

    /* =========================================
       SCROLL ANIMATIONS
       ========================================= */
    const observerOptions = {
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate sections on scroll
    document.querySelectorAll('section > .container').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease-out';
        observer.observe(el);
    });
});