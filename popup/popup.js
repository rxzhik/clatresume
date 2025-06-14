// Elements
const generateButton = document.getElementById('generate-button');
const checklistImg = document.getElementById('checklist-img');
const homeImg = document.getElementById('home-img');
const jobListDiv = document.getElementById('job-list-div');
const jobListUl = document.getElementById('job-list');
const noJobsMsg = document.getElementById('no-jobs-msg');

// Store jobs in localStorage under 'generatedJobs'
function getJobs() {
    return JSON.parse(localStorage.getItem('generatedJobs') || '[]');
}
function saveJob(job) {
    const jobs = getJobs();
    jobs.unshift(job); // newest first
    localStorage.setItem('generatedJobs', JSON.stringify(jobs));
}
function renderJobList() {
    const jobs = getJobs();
    jobListUl.innerHTML = '';
    if (jobs.length === 0) {
        noJobsMsg.style.display = 'block';
        return;
    }
    noJobsMsg.style.display = 'none';
    jobs.forEach((job, idx) => {
        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        li.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px; background: #23242a; border-radius: 8px; padding: 8px;">
                <span style="font-size: 0.95em; color: #a259ff;">Job #${jobs.length - idx}</span>
                <a href="${job.jobUrl}" target="_blank" style="color: #4fc3f7; text-decoration: underline; word-break: break-all;">Job Description</a>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <a href="${job.downloadUrl}" download style="color: #fff; background: #2575fc; border-radius: 4px; padding: 2px 8px; font-size: 0.9em;">Download Resume</a>
                    <button class="apply-btn" data-download="${job.downloadUrl}" data-joburl="${job.jobUrl}" style="background: #a259ff; color: #fff; border: none; border-radius: 4px; padding: 2px 10px; cursor: pointer; font-size: 0.9em;">Apply</button>
                </div>
            </div>
        `;
        jobListUl.appendChild(li);
    });
}

checklistImg.addEventListener('click', () => {
    if (jobListDiv.style.display === 'none') {
        renderJobList();
        jobListDiv.style.display = 'block';
    } else {
        jobListDiv.style.display = 'none';
    }
});

homeImg.addEventListener('click', () => {
    jobListDiv.style.display = 'none';
});

generateButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [{ result: pageHTML }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.documentElement.outerHTML
    });

    // Now send to your backend
    const response = await fetch("https://yourserver.com/api/generate-resume", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ html: pageHTML })
    });

    const { downloadUrl } = await response.json();
    const jobUrl = tab.url;
    saveJob({ downloadUrl, jobUrl });
    renderJobList();
});

// Delegate click for Apply buttons
jobListUl.addEventListener('click', async function (e) {
    if (e.target.classList.contains('apply-btn')) {
        const downloadUrl = e.target.getAttribute('data-download');
        const jobUrl = e.target.getAttribute('data-joburl');

        // Download resume using a temporary <a>
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'resume.pdf';
        a.click();

        // Remove job from localStorage
        let jobs = getJobs();
        jobs = jobs.filter(job => !(job.downloadUrl === downloadUrl && job.jobUrl === jobUrl));
        localStorage.setItem('generatedJobs', JSON.stringify(jobs));
        renderJobList();

        // Open job description in the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.update(tab.id, { url: jobUrl });
    }
});