/**
 * Utilities for parsing and computing data schema information
 */

export interface SchemaStats {
  totalColumns?: number;
  dataQuality?: number;
}

/**
 * Parse data schema JSON and compute statistics
 */
export function parseDataSchema(schemaJson: string | null | undefined): SchemaStats {
  if (!schemaJson) {
    return { totalColumns: undefined, dataQuality: undefined };
  }

  try {
    const schema = JSON.parse(schemaJson);
    const totalColumns = schema.columns?.length;

    // Calculate data quality as percentage of non-null values
    let dataQuality: number | undefined;
    if (schema.columns && schema.row_count) {
      const totalCells = schema.columns.length * schema.row_count;
      const nullCells = schema.columns.reduce(
        (sum: number, col: any) => sum + (col.null_count || 0),
        0,
      );
      dataQuality = Math.round(((totalCells - nullCells) / totalCells) * 100);
    }

    return { totalColumns, dataQuality };
  } catch (e) {
    console.error('Failed to parse data schema:', e);
    return { totalColumns: undefined, dataQuality: undefined };
  }
}
