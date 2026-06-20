using System;
using System.IO;
using System.Data;
using ExcelDataReader;

public class Program {
    public static void Main() {
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
        string filePath = @"c:\Users\rajan.patel\Documents\RP_AG\Excel\testPolicy.xlsx";
        using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
        {
            using (var reader = ExcelReaderFactory.CreateReader(stream))
            {
                var result = reader.AsDataSet();
                DataTable table = result.Tables[0];
                for (int i = 0; i < table.Columns.Count; i++)
                {
                    Console.WriteLine("COL_" + i + ": " + table.Rows[0][i].ToString());
                }
                if (table.Rows.Count > 1) {
                    Console.WriteLine("SAMPLE_ROW:");
                    for (int i = 0; i < table.Columns.Count; i++)
                    {
                        Console.WriteLine(table.Rows[0][i].ToString() + " => " + table.Rows[1][i].ToString());
                    }
                }
            }
        }
    }
}
