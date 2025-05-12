# Spotiviz: Music Trends and Listening Behavior  
*CS571: Data Visualization and Exploration – Final Project*

## Important Links  
[View the Spotiviz Website](https://md-hassan.github.io/CS571-Project-Spotiviz/)    
[Watch the Screencast Demo](https://www.youtube.com/watch?v=wFi1tBVjQGc)    
[View the Process Book](https://github.com/md-hassan/CS571-Project-Spotiviz/blob/main/CS571_ProcessBook.pdf)    
Dataset is available in the `data/` directory in this repository


## Overview  
**Spotiviz** is an interactive visualization platform that explores global and local trends in music consumption. Some of our aims with this project is to investigate:
- How long viral songs/albums dominate the charts
- Patterns of artist longevity and reinvention
- Shifts in genre popularity over time and across cities

We use real Spotify data to uncover how cultural forces shape music trends, both globally and locally.

## Code Structure  
- `index.html` — Landing page with navigation
- `pages/` — Contains all HTML code for all the pages
- `data/merge_data` — Cleaned and processed datasets for ranking songs, artists and albums
- `data/genre_ranking` — Cleaned and processed datasets for genre analytics
- `styles.css` — Main stylesheet for layout and design

## Prerequisites
- None (D3.js is loaded via CDN in the HTML files)

## How to Run the Project Locally

You can run the project locally using **Visual Studio Code** with the Live Server extension:

### Steps
1. Clone or download this repository.
2. Open the project folder in VS Code.
3. Right-click on `index.html` and choose **"Open with Live Server"**.
4. A new browser tab will open showing the homepage.
5. Use the navigation menu to explore all interactive visualizations.

## Interface Notes
- Use the **sidebar navigation** to access different sections.
- The **"About Spotiviz"** page provides an overview of our motivation, key findings, screencast, and data links.
