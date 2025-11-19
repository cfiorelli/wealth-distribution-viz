# Global Wealth Distribution Visualization

An interactive single-page web application that visualizes global wealth distribution using custom, user-defined wealth brackets. Built with real data from the UBS Global Wealth Report 2023, enhanced with statistical modeling for fine-grained exploration.

**Live Demo:** https://cfiorelli.github.io/wealth-distribution-viz/

![Wealth Distribution Visualization](https://img.shields.io/badge/Status-Live-success) ![Version](https://img.shields.io/badge/Version-2.0-blue) ![Data Year](https://img.shields.io/badge/Data_Year-2022-informational)

## Features

### Interactive Exploration
- **Custom Wealth Brackets**: Define your own wealth thresholds to explore different segments of the global wealth distribution
- **Dynamic Bar Chart**: Visualize population distribution across your custom brackets with real-time updates
- **Toggle Views**: Switch between percentage of population and absolute population counts
- **Coverage Analytics**: See exactly how much of global wealth and population your brackets capture

### Enhanced Dataset (v2.0)
- **76 Fine-Grained Bins**: From $0 to $100B+ with optimized granularity
- **Hybrid Approach**: Real data where available, statistical modeling for ultra-high wealth ranges
- **Full Transparency**: Clear labeling of data quality (real, interpolated, or modeled)

### Technical Highlights
- **No Build Step**: Pure HTML, CSS, and JavaScript - just open and run
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Client-Side Only**: No backend, no API calls, all data loaded locally
- **Chart.js Integration**: Professional, interactive visualizations

## Data Sources & Methodology

### Primary Sources
1. **UBS Global Wealth Report 2023** (2022 data)
   - Source: https://www.ubs.com/global/en/family-office-uhnw/reports/global-wealth-report-2023.html
   - Total global wealth: $454.4 trillion USD
   - Total adults tracked: 3.767 billion (out of ~5.4B global)

2. **Global Wealth Monitor 2022**
   - Source: http://wealth-monitor.co.uk/global-wealth-distribution-2022/
   - Percentile thresholds: p50=$8.7K, p90=$137K, p99=$1.08M, p99.9=$50M

3. **Statista Global Wealth Distribution**
   - Aggregated bracket data for population distribution

### Data Transformation Process

#### Original Data (4 coarse bins)
The source reports provided only 4 aggregate wealth brackets:
- $0 - $10K: 1.488B people (39.5%)
- $10K - $100K: 1.608B people (42.7%)
- $100K - $1M: 613M people (16.3%)
- $1M+: 58M people (1.5%)

#### Enhanced Data (76 fine-grained bins)

**1. Interpolation ($0 - $1M):**
- Linear subdivision of known aggregate brackets
- Granularity: $10K steps ($0-$100K), $25K steps ($100K-$1M)
- Assumption: Relatively uniform distribution within each original bracket
- Result: 47 bins covering the bottom 98.5% of the population

**2. Pareto Distribution Modeling ($1M - $100B+):**
- Used for ultra-high wealth ranges where granular data doesn't exist
- **Why Pareto?** The Pareto distribution is empirically validated for modeling wealth tails where a small percentage holds disproportionate wealth
- Alpha parameters: 1.3-1.5 (standard for wealth distributions)
- Validation: Results match known percentile thresholds
- Result: 29 bins covering the top 1.5% of the population

**3. Normalization:**
- All bins proportionally adjusted to sum exactly to global totals
- Ensures mathematical consistency: Σ population = 3.767B, Σ wealth = $454.4T

### Data Quality by Range

| Wealth Range | Data Quality | Method | Granularity |
|-------------|-------------|---------|------------|
| $0 - $10K | Real | Single bin from UBS | 1 bin |
| $10K - $100K | Interpolated | Linear subdivision | $10K steps |
| $100K - $1M | Interpolated | Linear subdivision | $25K steps |
| $1M - $100M | Modeled | Pareto (α=1.5) | $10M steps |
| $100M - $1B | Modeled | Pareto (α=1.4) | $100M steps |
| $1B+ | Modeled | Pareto (α=1.3) | $10B steps |

### Known Limitations

1. **Population Coverage**: Dataset includes 3.77B adults (out of ~5.4B globally) due to data availability constraints in some countries
2. **Interpolation Assumptions**: Assumes relatively uniform distribution within original $10K-$100K and $100K-$1M brackets
3. **Pareto Modeling**: Millionaire+ distribution is modeled, not directly measured
4. **Static Data**: Snapshot from end of 2022; does not reflect 2024 conditions
5. **Exchange Rate Effects**: All values in USD; local purchasing power not reflected

## Project Structure

```
wealth-distribution-viz/
├── index.html                      # Main application page
├── styles.css                      # Responsive styling
├── script.js                       # Core visualization logic
├── data/
│   └── wealth_distribution.json    # Enhanced dataset (76 bins)
├── generate_enhanced_data.py       # Python script to regenerate dataset
└── README.md                       # This file
```

## Usage

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/cfiorelli/wealth-distribution-viz.git
cd wealth-distribution-viz
```

2. Open `index.html` in your browser:
```bash
open index.html  # macOS
# or
start index.html  # Windows
# or just double-click the file
```

That's it! No installation, no build step, no dependencies.

### Using the Visualization

1. **Default View**: Opens with 4 default thresholds ($0, $10K, $100K, $1M)
2. **Add Brackets**: Click "+ Add Bracket" to create new wealth thresholds
3. **Edit Brackets**: Click any threshold value to edit it
4. **Delete Brackets**: Use the "Delete" button to remove a bracket
5. **Toggle Views**: Switch between "Population %" and "Absolute Count" to change the Y-axis
6. **Coverage Summary**: See real-time statistics on how much wealth and population your brackets cover

### Regenerating the Dataset

If you want to modify the data generation logic:

```bash
python3 generate_enhanced_data.py
```

This will regenerate `data/wealth_distribution.json` with 76 bins.

## Technical Architecture

### Frontend-Only Design
- **No Backend**: All computation happens in the browser
- **No Build Tools**: No webpack, no npm, no transpilation
- **CDN Dependencies**: Chart.js loaded via CDN

### Key Components

**1. Data Loading (`script.js`)**
```javascript
fetch('./data/wealth_distribution.json')
  .then(response => response.json())
  .then(data => initializeApp(data))
```

**2. Bracket Aggregation**
- User-defined thresholds create brackets: [T1, T2), [T2, T3), ..., [TN, ∞)
- `calculateOverlap()` function maps underlying bins to user brackets
- Handles open-ended ranges and partial overlaps

**3. Coverage Calculation**
- Tracks population and wealth in vs. out of defined brackets
- Real-time updates as brackets change

**4. Chart Rendering (Chart.js)**
- Bar chart with custom tooltips
- Toggle between percentage and absolute views
- Responsive layout

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6 support (2015+)
- Works on mobile browsers

## Future Enhancements

### Planned Features
1. **Regional Breakdowns**
   - Filter by continent/country
   - Compare wealth distributions across regions
   - Interactive world map

2. **Historical Trends**
   - Time-series data (2000-2024)
   - Animated transitions showing wealth concentration over time
   - Compare brackets across years

3. **Advanced Filtering**
   - Age demographics
   - Gender wealth gap analysis
   - Wealth sources (inheritance vs. earned)

4. **Export & Sharing**
   - Save custom bracket configurations
   - Generate shareable links
   - Export charts as PNG/SVG
   - Download data as CSV

5. **Alternative Models**
   - Log-normal distribution option
   - User-adjustable Pareto alpha parameters
   - Confidence intervals for modeled data

6. **Interactive Tutorials**
   - Guided exploration of inequality metrics
   - Explain statistical concepts (Gini coefficient, Pareto principle)
   - Case studies (e.g., "What does top 1% really mean?")

7. **Performance Optimizations**
   - Web Worker for heavy computations
   - Virtual scrolling for bracket list
   - Memoization of aggregation results

8. **Accessibility Improvements**
   - Screen reader support
   - Keyboard navigation
   - High-contrast mode
   - WCAG 2.1 AAA compliance

### Research Opportunities
- Integrate World Inequality Database (WID.world) API
- Connect with Forbes real-time billionaire data
- Add purchasing power parity (PPP) adjustments
- Model wealth mobility (transition matrices)

## Contributing

Contributions are welcome! Areas where help is needed:

- **Data Quality**: Finding more granular real data sources
- **Statistical Modeling**: Improving Pareto parameter estimation
- **UI/UX**: Design improvements for mobile
- **Documentation**: Tutorials, explainers, examples
- **Testing**: Cross-browser compatibility testing
- **Features**: Implementing items from the roadmap above

### Development Guidelines

1. **No Build Step Philosophy**: Keep it simple - avoid adding compilation/bundling
2. **Data Transparency**: Always clearly mark data quality (real/interpolated/modeled)
3. **Mathematical Rigor**: All aggregations must sum to exact totals
4. **Accessibility First**: Follow WCAG guidelines
5. **Performance**: Keep page load under 2 seconds

## License

MIT License - feel free to use for any purpose.

## Citation

If you use this visualization in research or publications:

```
Fiorelli, C. (2024). Global Wealth Distribution Visualization (v2.0).
Data from UBS Global Wealth Report 2023.
https://github.com/cfiorelli/wealth-distribution-viz
```

## Acknowledgments

- **UBS/Credit Suisse** for publishing comprehensive wealth distribution data
- **World Inequality Lab** for percentile threshold data
- **Statista** for aggregated population distributions
- **Chart.js team** for the excellent visualization library

## Contact & Support

- **Issues**: https://github.com/cfiorelli/wealth-distribution-viz/issues
- **Discussions**: https://github.com/cfiorelli/wealth-distribution-viz/discussions

---

Built with real data, statistical modeling, and a commitment to transparency in economic inequality visualization.
