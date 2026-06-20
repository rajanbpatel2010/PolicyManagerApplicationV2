using System;
using System.IO;
using System.Data;
using ExcelDataReader;

public class Program {
    public static void Main() {
        // Register encoding provider for older Excel formats
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

        string filePath = @"c:\Users\rajan.patel\Documents\RP_AG\Excel\testPolicy.xlsx";
        using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
        {
            using (var reader = ExcelReaderFactory.CreateReader(stream))
            {
                var result = reader.AsDataSet(new ExcelDataSetConfiguration()
                {
                    ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = false }
                });

                DataTable table = result.Tables[0];
                DataRow firstRow = table.Rows[0];

                Console.WriteLine("HEADERS_START");
                for (int i = 0; i < table.Columns.Count; i++)
                {
                    Console.WriteLine(firstRow[i].ToString());
                }
                Console.WriteLine("HEADERS_END");

                // Print first data row as well
                if (table.Rows.Count > 1) {
                    DataRow secondRow = table.Rows[1];
                    Console.WriteLine("SAMPLE_ROW_START");
                    for (int i = 0; i < table.Columns.Count; i++)
                    {
                        Console.WriteLine($"{firstRow[i]}: {secondRow[i]}");
                    }
                    Console.WriteLine("SAMPLE_ROW_END");
                }
            }
        }
    }
}
