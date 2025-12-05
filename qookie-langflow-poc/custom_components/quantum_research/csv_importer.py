from langflow.custom import Component
from langflow.io import FileInput, BoolInput, IntInput
from langflow.template import Output
import pandas as pd
from typing import Dict, Any
import logging

class QuantumCSVImporter(Component):
    display_name = "Quantum Partnership CSV Importer"
    description = "Import and validate quantum computing partnership data from CSV files"
    icon = "database"
    
    inputs = [
        FileInput(
            name="csv_file", 
            display_name="Partnership CSV File",
            info="CSV file containing quantum partnerships with columns: id, quantum_company, commercial_partner, year, notes"
        ),
        BoolInput(
            name="validate_data", 
            display_name="Validate Data", 
            value=True,
            info="Perform data validation on imported partnerships"
        ),
        IntInput(
            name="sample_size",
            display_name="Sample Size (0 for all)",
            value=0,
            info="Number of partnerships to import (0 = all, useful for testing)"
        )
    ]
    
    outputs = [
        Output(display_name="Partnership Data", name="partnerships", method="import_partnerships"),
        Output(display_name="Validation Report", name="validation_report", method="get_validation_report")
    ]
    
    def __init__(self):
        super().__init__()
        self.partnerships_data = None
        self.validation_report = {}
        self.logger = logging.getLogger(__name__)
    
    def validate_partnerships(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate partnership data and return validation report"""
        report = {
            "total_partnerships": len(df),
            "valid_partnerships": 0,
            "errors": [],
            "warnings": [],
            "missing_data": {}
        }
        
        # Required columns
        required_columns = ["id", "quantum_company", "commercial_partner"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            report["errors"].append(f"Missing required columns: {missing_columns}")
            return report
        
        # Check for missing data in required columns
        for col in required_columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                report["missing_data"][col] = missing_count
                report["warnings"].append(f"{missing_count} missing values in {col}")
        
        # Check for duplicates
        duplicate_count = df.duplicated(subset=["quantum_company", "commercial_partner"]).sum()
        if duplicate_count > 0:
            report["warnings"].append(f"{duplicate_count} duplicate partnerships found")
        
        # Check year format
        if "year" in df.columns:
            invalid_years = df[df["year"].notna() & ~df["year"].astype(str).str.match(r"^(19|20)\d{2}$")]
            if len(invalid_years) > 0:
                report["warnings"].append(f"{len(invalid_years)} partnerships with invalid year format")
        
        # Count valid partnerships (no missing required data)
        valid_mask = df[required_columns].notna().all(axis=1)
        report["valid_partnerships"] = valid_mask.sum()
        
        return report
    
    def import_partnerships(self) -> pd.DataFrame:
        """Import partnership data from CSV file"""
        try:
            if not self.csv_file:
                raise ValueError("No CSV file provided")
            
            # Read CSV file
            df = pd.read_csv(self.csv_file)
            self.logger.info(f"Imported {len(df)} partnerships from CSV")
            
            # Apply sample size if specified
            if self.sample_size > 0 and self.sample_size < len(df):
                df = df.head(self.sample_size)
                self.logger.info(f"Sampled first {self.sample_size} partnerships for testing")
            
            # Validate data if requested
            if self.validate_data:
                self.validation_report = self.validate_partnerships(df)
                self.logger.info(f"Validation complete: {self.validation_report['valid_partnerships']}/{self.validation_report['total_partnerships']} valid partnerships")
            
            # Store for validation report output
            self.partnerships_data = df
            
            return df
            
        except Exception as e:
            self.logger.error(f"Error importing CSV: {str(e)}")
            raise
    
    def get_validation_report(self) -> Dict[str, Any]:
        """Return validation report"""
        return self.validation_report if self.validation_report else {"message": "No validation performed"}