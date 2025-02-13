// Global variables to hold candidates, topics, and colours
let candidates = [];
let topics = [];
let topicColors = {};
let subtopicColors = {};

// Function to load Excel data from a Google Sheets URL
function loadExcelFromGoogleSheet(sheetUrl) {
    fetch(sheetUrl) // Fetch the data from the provided Google Sheets URL
        .then(response => response.arrayBuffer()) // Convert the response to an ArrayBuffer
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' }); // Read the Excel file using XLSX
            const sheetName = workbook.SheetNames[0]; // Get the first sheet name
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]); // Convert the sheet data to JSON

            processExcelData(jsonData); // Process the JSON data
        })
        .catch(error => console.error('Error loading Excel file from Google Sheets:', error)); // Handle any errors
}

// Function to process the Excel data and populate global variables
function processExcelData(data) {
    candidates = [];
    topics = new Set(); // Use a Set to automatically handle unique topics

    data.forEach(row => {
        const candidateName = row.name;
        const image = row.image;
        const partySymbol = row.partySymbol;
        const title = row.title;
        const description = row.description;
        const page = row.page;
        const link = row.link;
        const topic = row.topic;
        const subtopic = row.subtopic || '';

        // Add topics with valid titles to the topics Set
        if (title !== "-" && title.trim() !== "") {
            topics.add(topic);
        }

        // Find or create a candidate object
        let candidate = candidates.find(c => c.name === candidateName);
        if (!candidate) {
            candidate = {
                name: candidateName,
                image: image,
                partySymbol: partySymbol,
                promises: {},
                titleCount: 0,
                linkCount: 0
            };
            candidates.push(candidate);
        }

        // Increment title and link counts for the candidate
        if (title !== "-" && title.trim() !== "") {
            candidate.titleCount++;
        }
        if (link && link.trim() !== '') {
            candidate.linkCount++;
        }

        // Organise promises by topic and subtopic
        if (!candidate.promises[topic]) {
            candidate.promises[topic] = {};
        }
        if (!candidate.promises[topic][subtopic]) {
            candidate.promises[topic][subtopic] = [];
        }
        candidate.promises[topic][subtopic].push({ title, description, page, link });
    });

    // Sort subtopics for each candidate's promises
    candidates.forEach(candidate => {
        Object.keys(candidate.promises).forEach(topic => {
            const sortedSubtopics = Object.keys(candidate.promises[topic]).sort((a, b) => parseInt(a) - parseInt(b));
            const sortedPromises = {};

            sortedSubtopics.forEach(subtopic => {
                sortedPromises[subtopic] = candidate.promises[topic][subtopic];
            });

            candidate.promises[topic] = sortedPromises;
        });
    });

    topics = Array.from(topics); // Convert the Set of topics to an array

    assignColorsToTopics(topics); // Assign colours to topics
    assignColorsToSubtopics(); // Assign colours to subtopics

    // Populate the UI with candidate cards and topic sections
    populateCandidateCardsSection(candidates);
    createSectionsForTopics(topics);
    populateCandidateCheckboxes(candidates);
    populateTopicCheckboxes(topics);
    updateDisplay(); // Update the display with the filtered candidates and topics
}

// Function to populate the candidate cards section of the UI
function populateCandidateCardsSection(candidates) {
    const candidateCardsContainer = d3.select("#candidate-cards");
    candidateCardsContainer.html(''); // Clear the existing content

    candidates.forEach(candidate => {
        const candidateCard = candidateCardsContainer.append("div")
            .attr("class", "new-candidate-card");

        // Add candidate image
        candidateCard.append("img")
            .attr("src", candidate.image)
            .attr("alt", candidate.name);

        // Add candidate name
        candidateCard.append("h3")
            .text(candidate.name);

        // Add summary stats for rationales per promise
        candidateCard.append("p")
            .attr("class", "summary-stats")
            .text(`Rationales per Promise: ${candidate.linkCount}/${candidate.titleCount}`);

        // Add party symbol
        candidateCard.append("div")
            .attr("class", "party-symbol")
            .append("img")
            .attr("src", candidate.partySymbol)
            .attr("alt", `${candidate.name} party symbol`);
    });

    equalizeCandidateCardWidths(); // Ensure all candidate cards have the same width
}

// Function to equalise the widths of candidate cards
function equalizeCandidateCardWidths() {
    const cards = document.querySelectorAll('.new-candidate-card');
    let maxWidth = 0;

    // Find the maximum width among all candidate cards
    cards.forEach(card => {
        const width = card.getBoundingClientRect().width;
        if (width > maxWidth) {
            maxWidth = width;
        }
    });

    // Set all cards to the maximum width
    cards.forEach(card => {
        card.style.width = `${maxWidth}px`;
    });
}

// Function to create sections in the UI for each topic
function createSectionsForTopics(topics) {
    const contentContainer = d3.select("#content");

    topics.forEach(topic => {
        const topicSection = contentContainer.append("div")
            .attr("id", `${topic.toLowerCase().replace(/\s+/g, '-')}-section`)
            .attr("class", "topic-section");

        // Add a title for each topic section
        topicSection.append("div")
            .attr("class", "section-title-container")
            .append("h2")
            .attr("class", "section-title")
            .text(topic);

        // Add a container for candidate cards within each topic section
        topicSection.append("div")
            .attr("class", "candidate-card-container")
            .attr("id", `${topic.toLowerCase().replace(/\s+/g, '-')}`);
    });
}

// Function to populate the candidate checkboxes in the filter section
function populateCandidateCheckboxes(candidates) {
    const candidateCheckboxesContainer = d3.select("#candidate-checkboxes");
    candidateCheckboxesContainer.html(''); // Clear the existing content

    // Add a checkbox for selecting all candidates
    const allLabel = candidateCheckboxesContainer.append("label");
    allLabel.append("input")
        .attr("type", "checkbox")
        .attr("value", "all")
        .on("change", function() {
            const isChecked = this.checked;
            candidateCheckboxesContainer.selectAll("input").property("checked", isChecked);
            updateDisplay(); // Update the display when the selection changes
        });
    allLabel.append("span").text("All");
    allLabel.append("br");

    // Add a checkbox for each candidate
    candidates.forEach(candidate => {
        const checkboxLabel = candidateCheckboxesContainer.append("label");
        checkboxLabel.append("input")
            .attr("type", "checkbox")
            .attr("value", candidate.name)
            .on("change", updateDisplay);
        checkboxLabel.append("span").text(candidate.name);
        checkboxLabel.append("br");
    });
}

// Function to populate the topic checkboxes in the filter section
function populateTopicCheckboxes(topics) {
    const topicCheckboxesContainer = d3.select("#topic-checkboxes");
    topicCheckboxesContainer.html(''); // Clear the existing content

    // Add a checkbox for selecting all topics
    const allLabel = topicCheckboxesContainer.append("label");
    allLabel.append("input")
        .attr("type", "checkbox")
        .attr("value", "all")
        .on("change", function() {
            const isChecked = this.checked;
            topicCheckboxesContainer.selectAll("input").property("checked", isChecked);
            updateDisplay(); // Update the display when the selection changes
        });
    allLabel.append("span").text("All");
    allLabel.append("br");

    // Add a checkbox for each topic
    topics.forEach(topic => {
        const checkboxLabel = topicCheckboxesContainer.append("label");
        checkboxLabel.append("input")
            .attr("type", "checkbox")
            .attr("value", topic)
            .on("change", updateDisplay);
        checkboxLabel.append("span").text(topic);
        checkboxLabel.append("br");
    });
}

// Function to update the display based on selected candidates and topics
function updateDisplay() {
    const selectedCandidates = [];
    d3.selectAll("#candidate-checkboxes input:checked").each(function() {
        if (this.value !== "all") {
            selectedCandidates.push(this.value);
        }
    });

    const selectedTopics = [];
    d3.selectAll("#topic-checkboxes input:checked").each(function() {
        if (this.value !== "all") {
            selectedTopics.push(this.value);
        }
    });

    let filteredCandidates = candidates;

    // Filter candidates based on the selected checkboxes
    if (selectedCandidates.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => selectedCandidates.includes(candidate.name));
    }

    // Clear the content in each topic section
    topics.forEach(topic => {
        const sectionId = `#${topic.toLowerCase().replace(/\s+/g, '-')}`;
        d3.select(sectionId).selectAll(".candidate-card").remove();
    });

    // Add candidate cards to the respective topic sections based on selected topics
    filteredCandidates.forEach(candidate => {
        Object.keys(candidate.promises).forEach(topic => {
            if (selectedTopics.length === 0 || selectedTopics.includes(topic)) {
                createOrUpdateCandidateCard(`#${topic.toLowerCase().replace(/\s+/g, '-')}`, candidate, candidate.promises[topic], topic.toLowerCase().replace(/\s+/g, '-'));
            }
        });
    });

    // Show or hide topic sections based on whether they have candidate cards
    topics.forEach(topic => {
        const sectionId = `#${topic.toLowerCase().replace(/\s+/g, '-')}-section`;
        if (d3.select(`#${topic.toLowerCase().replace(/\s+/g, '-')}`).selectAll(".candidate-card").empty()) {
            d3.select(sectionId).classed("hidden", true);
        } else {
            d3.select(sectionId).classed("hidden", false);
        }
    });

    equalizePromiseHeights(); // Ensure all promise containers have the same height
}

// Function to create or update a candidate card in a topic section
function createOrUpdateCandidateCard(containerId, candidate, promisesByTopic, topicClass) {
    const container = d3.select(containerId);

    // Check if the candidate card already exists in the container
    let candidateCard = container.select(`.candidate-card[data-candidate="${candidate.name}"]`);

    // If it doesn't exist, create a new candidate card
    if (candidateCard.empty()) {
        candidateCard = container.append("div")
            .attr("class", `candidate-card ${topicClass}`)
            .attr("data-candidate", candidate.name);

        candidateCard.append("img")
            .attr("src", candidate.image)
            .attr("alt", candidate.name);

        candidateCard.append("h3")
            .text(candidate.name);

        candidateCard.append("p")
            .attr("class", "summary-stats")
            .text(`Rationales per Promise: 0/0`);

        candidateCard.append("div")
            .attr("class", "party-symbol")
            .append("img")
            .attr("src", candidate.partySymbol)
            .attr("alt", `${candidate.name} party symbol`);

        candidateCard.append("div")
            .attr("class", "promises-container");
    }

    let topicTitleCount = 0;
    let topicLinkCount = 0;

    // Count the titles and links for the current topic
    Object.keys(promisesByTopic).forEach(subtopic => {
        const subtopicPromises = promisesByTopic[subtopic];

        subtopicPromises.forEach(promise => {
            if (promise.title && promise.title.trim() !== "" && promise.title !== "-") {
                topicTitleCount++;
            }
            if (promise.link && promise.link.trim() !== "") {
                topicLinkCount++;
            }
        });
    });

    // Update the summary stats for the candidate card
    candidateCard.select(".summary-stats")
        .text(`Rationales per Promise: ${topicLinkCount}/${topicTitleCount}`);

    // Add promises to the candidate card
    Object.keys(promisesByTopic).forEach(subtopic => {
        const subtopicPromises = promisesByTopic[subtopic];

        subtopicPromises.forEach(promise => {
            const promiseContainer = candidateCard.select(".promises-container")
                .append("div")
                .attr("class", `promise-container ${topicClass}`)
                .style("background-color", getColorBySubtopic(subtopic))
                .style("margin-bottom", "10px")
                .style("padding", "10px")
                .style("border-radius", "8px");

            // Add promise details to the container
            promiseContainer.append("div")
                .attr("class", `promise ${topicClass}`)
                .html(`<p class="promise-title">${promise.title}</p><p class="promise-page">Page: ${promise.page}</p><p>${promise.description}</p>`);

            // Add a button to open the rationale link in a new tab if available
            if (promise.link && promise.link.trim() !== '') {
                promiseContainer.append("button")
                    .attr("class", "reference-button")
                    .text("Rationale")
                    .on("click", () => {
                        window.open(promise.link, '_blank');
                    });
            }
        });
    });
}

// Function to ensure all promise containers have the same height
function equalizePromiseHeights() {
    topics.forEach(topic => {
        const promiseContainers = d3.select(`#${topic.toLowerCase().replace(/\s+/g, '-')}`)
                                    .selectAll('.promise-container')
                                    .nodes();

        let maxHeight = 0;

        // Find the maximum height among all promise containers
        promiseContainers.forEach(container => {
            const height = container.getBoundingClientRect().height;
            if (height > maxHeight) {
                maxHeight = height;
            }
        });

        // Set all containers to the maximum height
        promiseContainers.forEach(container => {
            container.style.height = `${maxHeight}px`;
        });
    });
}

// Function to assign colours to topics
function assignColorsToTopics(topics) {
    topics.forEach(topic => {
        if (!topicColors[topic]) {
            topicColors[topic] = generateRandomColor();
        }
    });
}

// Function to assign colours to subtopics
function assignColorsToSubtopics() {
    candidates.forEach(candidate => {
        Object.keys(candidate.promises).forEach(topic => {
            Object.keys(candidate.promises[topic]).forEach(subtopic => {
                if (!subtopicColors[subtopic] && subtopic !== '') {
                    subtopicColors[subtopic] = generateRandomColor();
                }
            });
        });
    });
}

// Function to get the colour for a subtopic
function getColorBySubtopic(subtopic) {
    return subtopicColors[subtopic] || "#ffffff";
}

let hueShift = 0; // Variable to control hue shift for random colour generation

// Function to generate a random colour
function generateRandomColor() {
    const saturation = 60;
    const lightness = 80;

    hueShift += 137.5; // Increment hueShift for each new colour
    const hue = hueShift % 360; // Ensure hue stays within 0-360 range

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Event listener to close all checkboxes when clicking outside of the filter container
document.addEventListener("click", function(event) {
    const filterContainer = document.querySelector(".filter-container");
    if (!filterContainer.contains(event.target)) {
        closeAllCheckboxes();
    }
});

// Function to close all checkboxes
function closeAllCheckboxes() {
    document.querySelectorAll(".checkboxes").forEach(checkboxContainer => {
        checkboxContainer.style.display = "none";
    });
}

// Function to toggle the display of checkboxes for filtering
function toggleCheckboxes(id) {
    const checkboxes = document.getElementById(id);
    if (checkboxes.style.display === "block") {
        checkboxes.style.display = "none";
    } else {
        closeAllCheckboxes();
        checkboxes.style.display = "block";
    }
}

// Load the Excel data from the provided Google Sheets URL
loadExcelFromGoogleSheet('https://docs.google.com/spreadsheets/d/1_q6IaRErhJnPM_pTwiI7pGvOTJ4PJJRMTaz4zr-rmio/export?format=xlsx');
