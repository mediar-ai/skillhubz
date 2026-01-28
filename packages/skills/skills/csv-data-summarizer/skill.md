# CSV Data Summarizer

Analyze CSV files and provide comprehensive summaries with statistical insights and visualizations.

## Prerequisites

- Python 3.8+
- pandas, matplotlib, seaborn

## Instructions

### Critical Behavior

**DO NOT ask what the user wants to do with the data.**
**IMMEDIATELY run comprehensive analysis and present results.**

### Automatic Analysis Steps

1. **Load and inspect** CSV into pandas DataFrame
2. **Identify data structure** - column types, dates, numerics, categories
3. **Determine relevant analyses** based on data type:
   - Sales/E-commerce: Time-series, revenue, product performance
   - Customer data: Distributions, segmentation, geographic patterns
   - Financial data: Trends, summaries, correlations
   - Operational data: Time-series, metrics, distributions
   - Survey data: Frequencies, cross-tabulations
   - Generic: Adapts based on column types

### Analysis Output

For each dataset, automatically generate:

1. **Data Overview**
   - Shape, columns, types
   - Missing values summary
   - Memory usage

2. **Statistical Summary**
   - Descriptive statistics
   - Distribution analysis
   - Correlation matrix

3. **Visualizations**
   - Distribution plots
   - Time series (if dates present)
   - Category breakdowns
   - Correlation heatmaps

4. **Insights**
   - Key findings
   - Anomalies detected
   - Recommendations

## Guidelines

1. Run full analysis immediately - no questions
2. Adapt analysis to detected data type
3. Generate ALL relevant visualizations
4. Present complete results without waiting for input
5. Include actionable insights

## Notes

- Intelligently adapts to different industries
- Inspects data first, then determines relevant analyses
- No user input required - just provide the CSV

Source: coffeefuelbump/csv-data-summarizer-claude-skill
