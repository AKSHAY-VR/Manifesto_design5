import * as d3 from 'd3';

// Assuming data for candidates and their promises
const candidates = [
    {
        name: "Ranil Wickremesinghe",
        image: "path_to_image_ranil.png",
        promises: [
            { text: "Promise 01", page: "Page 09" },
            { text: "Promise 02", page: "Page 10" },
            { text: "Promise 03", page: "Page 13" },
            { text: "Promise 04", page: "Page 20" },
        ]
    },
    {
        name: "Anura Dissanayake",
        image: "path_to_image_anura.png",
        promises: [
            { text: "Promise 01", page: "Page 03" },
            { text: "Promise 02", page: "Page 08" },
        ]
    },
    {
        name: "Sajith Premadasa",
        image: "path_to_image_sajith.png",
        promises: [
            { text: "Promise 01", page: "Page 05" },
            { text: "Promise 02", page: "Page 08" },
            { text: "Promise 03", page: "Page 09" },
            { text: "Promise 04", page: "Page 10" },
        ]
    },
    {
        name: "Namal Rajapaksa",
        image: "path_to_image_namal.png",
        promises: [
            { text: "Promise 01", page: "Page 02" },
            { text: "Promise 02", page: "Page 06" },
        ]
    }
];

// Create candidate cards
const container = d3.select("#candidates").selectAll(".candidate-card")
    .data(candidates)
    .enter()
    .append("div")
    .attr("class", "candidate-card");

container.append("img")
    .attr("src", d => d.image)
    .attr("alt", d => d.name);

container.append("h3")
    .text(d => d.name);

container.selectAll(".promise")
    .data(d => d.promises)
    .enter()
    .append("div")
    .attr("class", "promise")
    .text(d => `${d.text} - ${d.page}`);

container.append("div")
    .attr("class", "icon-section")
    .selectAll(".icon")
    .data([0, 1, 2]) // You can map these numbers to specific icons if needed
    .enter()
    .append("div")
    .attr("class", "icon");

    