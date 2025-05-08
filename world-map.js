document.addEventListener('DOMContentLoaded', function() {
    // Set up dimensions for the SVG
    const width = document.getElementById('world-map').clientWidth;
    const height = document.getElementById('world-map').clientHeight;
    
    // Create SVG element
    const svg = d3.select('#world-map')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'width: 100%; height: 100%;');
        
    // Define map projection - using a simple equirectangular projection for flatness
    const projection = d3.geoEquirectangular()
        .scale((width) / (2 * Math.PI))
        .translate([width / 2, height / 1.8]);
        
    // Create path generator
    const path = d3.geoPath().projection(projection);
    
    // Create tooltip
    const tooltip = d3.select('#tooltip');
    
    // Load world map data and Spotify countries data
    Promise.all([
        d3.json('https://unpkg.com/world-atlas@2/countries-110m.json'),
        d3.json('data/countries.json')
    ]).then(([worldData, spotifyData]) => {
        // Convert TopoJSON to GeoJSON
        const countries = topojson.feature(worldData, worldData.objects.countries).features;

        // --- INSPECTION STEP ---
        console.log("Country names from map data:", countries.map(c => c.properties.name));
        console.log("Spotify countries data:", spotifyData);
        // --- END INSPECTION STEP ---

        // Create a set of country codes with Spotify availability
        const spotifyAvailableCountries = new Set();
        
        // Process the JSON data with the "Countries" key
        if (Array.isArray(spotifyData)) {
            spotifyData.forEach(item => {
                if (item.Countries) {
                    spotifyAvailableCountries.add(item.Countries);
                }
            });
        } else if (spotifyData.countries) {
            // If it has a 'countries' property that is an array
            spotifyData.countries.forEach(country => {
                if (typeof country === 'string') {
                    spotifyAvailableCountries.add(country);
                } else if (country.code) {
                    spotifyAvailableCountries.add(country.code);
                } else if (country.name) {
                    spotifyAvailableCountries.add(country.name);
                }
            });
        }
        
        // Draw the map
        svg.selectAll('path')
            .data(countries)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'country')
            .attr('fill', function(d) {
                // Check if the country has Spotify availability
                // This depends on how your countries.json is structured
                // Adjust the condition based on your data structure
                const isAvailable = spotifyAvailableCountries.has(d.properties.name) || 
                                    spotifyAvailableCountries.has(d.id);
                return isAvailable ? '#1DB954' : '#d3d3d3';
            })
            .on('mouseover', function(event, d) {
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                
                const isAvailable = spotifyAvailableCountries.has(d.properties.name) || 
                                    spotifyAvailableCountries.has(d.id);
                
                tooltip.html(`
                    <strong>${d.properties.name}</strong><br>
                    Spotify: ${isAvailable ? 'Available' : 'Not Available'}
                `)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                svg.selectAll('path')
                    .attr('transform', event.transform);
            });
            
        svg.call(zoom);
        
    }).catch(error => {
        console.error('Error loading the data:', error);
        document.getElementById('world-map').innerHTML = `
            <div style="color: red; text-align: center; margin-top: 50px;">
                Error loading map data. Please check your internet connection and refresh the page.
            </div>
        `;
    });
});