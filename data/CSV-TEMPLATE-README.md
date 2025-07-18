# CSV Template for Quantum Partnership Data

This template shows how to properly format partnership data for the Quantum Case Study Tool.

## File Location
- **Template**: `/data/quantum-partnerships-template.csv`
- **Active Data**: `/public/data/quantum-partnerships.csv` (this is what the app loads)

## Column Definitions

### `id`
- **Type**: Integer
- **Required**: Yes
- **Description**: Unique identifier for each partnership
- **Format**: Sequential numbers starting from 0
- **Example**: `0`, `1`, `2`, `3`

### `quantum_company`
- **Type**: String
- **Required**: Yes
- **Description**: Name of the quantum computing company
- **Format**: Company name as commonly known
- **Examples**: `IBM`, `Google Quantum AI`, `Rigetti`, `IonQ`, `D-Wave`

### `commercial_partner`
- **Type**: String
- **Required**: Yes
- **Description**: Name of the commercial/enterprise partner
- **Format**: Company name, can include multiple companies separated by commas
- **Examples**: `Boeing`, `Goldman Sachs`, `Accenture, Biogen`, `Mercedes-Benz`


### `year`
- **Type**: Integer
- **Required**: Yes
- **Description**: Year the partnership was announced or started
- **Format**: Four-digit year
- **Examples**: `2023`, `2022`, `2021`

### `notes`
- **Type**: String
- **Required**: No (but recommended)
- **Description**: Brief description of the partnership focus and application area
- **Format**: 1-2 sentences describing the quantum computing application
- **Examples**: 
  - `Drug discovery for neurological conditions`
  - `Portfolio optimization and risk analysis using quantum algorithms`
  - `Quantum simulation for battery chemistry and materials science`

## Adding New Partnerships

1. **Get the template**: Copy `/data/quantum-partnerships-template.csv`
2. **Add your data**: Replace example rows with real partnerships
3. **Update IDs**: Make sure each partnership has a unique, sequential ID
4. **Deploy**: Copy your updated CSV to `/public/data/quantum-partnerships.csv`
5. **Refresh**: Reload the app to see your new partnerships

## Data Quality Tips

- **Research thoroughly**: Include partnerships that actually exist and are publicly announced
- **Be specific**: Notes should describe the actual quantum computing application, not just "quantum research"
- **Check dates**: Use the year the partnership was first announced or started
- **Verify status**: Make sure the status reflects the current state of the partnership
- **Use official names**: Use the companies' official names as they appear in press releases

## Common Applications Areas

- Drug discovery and molecular simulation
- Financial modeling and portfolio optimization
- Supply chain and logistics optimization
- Materials science and battery chemistry
- Aerospace and automotive optimization
- Cybersecurity and encryption
- Machine learning and AI enhancement
- Weather and climate modeling
- Energy grid optimization
- Risk analysis and fraud detection

## Example Entry

```csv
id,quantum_company,commercial_partner,year,notes
42,Quantinuum,Roche,2023,Quantum machine learning for drug discovery focusing on protein folding simulation and molecular optimization
```

This entry shows:
- Unique ID (42)
- Clear quantum company name (Quantinuum)
- Clear commercial partner (Roche)
- Announcement year (2023)
- Specific application description (protein folding simulation)