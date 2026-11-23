/**
 * Sources that come from a database (Figma 916:23883, 916:35330). A database is not shown; the drawer says what was asked
 * of it, in plain words or as the SQL that was run, and shows the rows it returned. Prototype data: the database, table,
 * query and figures are made up to match the claim in the note.
 */
export type DatabaseSource = {
  /** The table the figure was read from; it is the associated-citation chip's label. */
  table: string;
  /** Where "open in database" goes. */
  url: string;
  /** What was asked, in plain words: label and value, in the order shown. */
  request: { label: string; value: string }[];
  /** The query, one string per line. */
  sql: string[];
  file: string;
  dialect: string;
  result: {
    columns: string[];
    rows: string[][];
    /** The note under the result's title: rows, when it ran, how long it took. */
    meta: string;
  };
};

export const DATABASE_SOURCES: Record<number, DatabaseSource> = {
  19: {
    table: 'company_financials',
    url: 'https://privatecircle.co',
    request: [
      { label: 'Looked in', value: 'finance_warehouse › company_financials' },
      { label: 'Company', value: 'Romsons Group Private Limited' },
      { label: 'Years', value: 'FY2022 and FY2023' },
      { label: 'Figure', value: 'Operating revenue, in ₹ crore' },
      { label: 'Worked out', value: 'FY2023 against FY2022, as a (%) change' },
    ],
    sql: [
      'SELECT',
      '  fiscal_year,',
      '  SUM(operating_revenue_cr) AS revenue_cr',
      'FROM finance_warehouse.company_financials',
      "WHERE company_id = 'ROMSONS_GROUP'",
      '  AND fiscal_year IN (2022, 2023)',
      'GROUP BY fiscal_year',
      'ORDER BY fiscal_year;',
    ],
    file: 'revenue_by_fiscal_year.sql',
    dialect: 'PostgreSQL',
    result: {
      columns: ['fiscal_year', 'revenue_cr'],
      rows: [
        ['2022', '512'],
        ['2023', '584'],
      ],
      meta: '2 rows · ran 14 Sept ‘25, 9:00 AM · 0.3 s',
    },
  },
};
