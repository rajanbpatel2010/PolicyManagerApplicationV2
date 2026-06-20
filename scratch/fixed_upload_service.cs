    public async Task<ApiResponse<ExcelUploadResultDto>> UploadPoliciesFromExcelAsync(IFormFile file, int userId)
    {
        var result = new ExcelUploadResultDto();

        if (file == null || file.Length == 0)
        {
            result.Errors.Add("File is empty or not provided.");
            return ApiResponse<ExcelUploadResultDto>.FailResponse("File is empty or not provided.");
        }

        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

        try
        {
            using var stream = file.OpenReadStream();
            using var reader = ExcelReaderFactory.CreateReader(stream);

            var conf = new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            };

            var dataSet = reader.AsDataSet(conf);
            if (dataSet.Tables.Count == 0)
            {
                result.Errors.Add("No sheets found in Excel file.");
                return ApiResponse<ExcelUploadResultDto>.FailResponse("No sheets found in Excel file.");
            }

            // Always take the first sheet or find one named 'Policy'
            var dataTable = dataSet.Tables.Cast<DataTable>().FirstOrDefault(t => t.TableName.Contains("Policy", StringComparison.OrdinalIgnoreCase)) 
                           ?? dataSet.Tables[0];
            
            result.TotalRowsProcessed = dataTable.Rows.Count;

            // Map Column Headers if present
            var colDict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int j = 0; j < dataTable.Columns.Count; j++)
            {
                colDict[dataTable.Columns[j].ColumnName.Trim()] = j;
            }

            // Key helper for column index discovery with fallback to original hardcoded ones if headers missing
            int FindCol(string[] names, int fallbackIdx) {
                foreach (var name in names) {
                    if (colDict.TryGetValue(name, out int idx)) {
                        _logger.LogInformation("Excel Import - Mapped Header '{Name}' to Index {Index}", name, idx);
                        return idx;
                    }
                }
                // Try partial match if no exact match
                foreach(var col in colDict) {
                    if (names.Any(n => col.Key.Contains(n, StringComparison.OrdinalIgnoreCase))) {
                         _logger.LogInformation("Excel Import - Partial Match Header '{Col}' for '{Names}' to Index {Idx}", col.Key, string.Join("|", names), col.Value);
                         return col.Value;
                    }
                }
                return fallbackIdx;
            }

            int schemeIdx = FindCol(new[] { "Plan Id", "Plan ID", "Scheme Name", "Scheme" }, 0);
            int compIdx = FindCol(new[] { "Policy Company", "Company Name", "Company", "Insurer" }, 1);
            int prodNameIdx = FindCol(new[] { "Policy Name", "Product Name", "Product", "Plan" }, 2);
            int pNumIdx = FindCol(new[] { "Policy Number", "Policy No", "PolicyNum" }, 3);
            int sDateIdx = FindCol(new[] { "Policy Start Date", "Start date", "Inception Date", "From Date" }, 4);
            int eDateIdx = FindCol(new[] { "Policy End Date", "End date", "Expiry Date", "To Date" }, 5);
            int covIdx = FindCol(new[] { "Insured Amount", "Insurred Amount", "Sum Insured", "Coverage", "Coverage Amount", "SI" }, 6);
            int locIdx = FindCol(new[] { "Location / Unit", "Location", "Unit" }, 7);
            int durIdx = FindCol(new[] { "Term Years", "Duration (Years/Month)", "Duration" }, 8);
            int covDescIdx = FindCol(new[] { "Coverage Description" }, 9);
            int premIdx = FindCol(new[] { "Yearly Premium Pmt Amt", "Premium Amount", "Premium", "Amount", "Nett Premium" }, 10);
            int taxIdx = FindCol(new[] { "Tax", "Tax Amount", "Service Tax", "GST" }, 11);
            int gstIdx = FindCol(new[] { "GST Applicable", "GST Applicable (Y/N)" }, 12);
            int nextInstIdx = FindCol(new[] { "Next Payment Date", "Policy Pay Date", "Next Installment Date", "Next Due", "Due Date" }, 13);
            int instAmtIdx = FindCol(new[] { "Basic Amt", "Installment Amount", "Inst. Amt" }, 14);
            int instTypeIdx = FindCol(new[] { "Installment Type", "Payment Cycle", "Type", "Frequency", "Cycle" }, 15);
            int stageIdx = FindCol(new[] { "Policy Stage", "Status", "Stage" }, 16);
            int netPremIdx = FindCol(new[] { "Amount W/O Tax", "Net Premium", "Final Premium" }, 17);
            int hNameIdx = FindCol(new[] { "Name", "Policy Holder Name", "Customer Name", "Holder Name" }, 18);
            int nomineeIdx = FindCol(new[] { "Nominne", "Nominee Name", "Nominee" }, 19);
            int bankIdx = FindCol(new[] { "Account No", "Auto Debit Bank", "Bank Account Details", "Bank", "Account" }, 20);
            int agentIdx = FindCol(new[] { "Agent Name", "Agent" }, 21);
            int phoneIdx = FindCol(new[] { "Customer Mobile Number", "PhoneNumber", "Mobile", "Phone Number", "Contact" }, 22);
            int emailIdx = FindCol(new[] { "Email", "Customer Email Address", "Customer Email", "Email ID" }, 23);
            int altPhoneIdx = FindCol(new[] { "Alt Contact", "Alternate Contact Number" }, 24);
            int remarksIdx = FindCol(new[] { "Comments", "Special Remarks", "Remarks" }, 25);
            int matDateIdx = FindCol(new[] { "Maturity date", "MaturityDate", "Maturity", "Maturity date.1" }, 26);
            int matAmtIdx = FindCol(new[] { "Total Maturity Amount", "Maturity Amount", "Mat Amt" }, 27);
            int plusOtherIdx = FindCol(new[] { "Plus++ Other", "Other Amount" }, 28);
            int addDetailsIdx = FindCol(new[] { "Additional Details", "More Info" }, 29);
            int relationIdx = FindCol(new[] { "Relation", "Nominee Relation" }, 30);
            int pTypeIdx = FindCol(new[] { "Policy Type", "Type" }, 31);
            int paidInstIdx = FindCol(new[] { "Payed Instalments", "Paid Inst", "Installments Paid" }, 32);
            int payTermsIdx = FindCol(new[] { "Paying term", "Paying Terms", "Terms" }, 33);
            int totalPaidIdx = FindCol(new[] { "Total Paid up to date", "Total Paid" }, 34);
            int annuityDateIdx = FindCol(new[] { "Annuity Date (Vesting Date)", "Annuity Date", "Vesting Date" }, 35);
            int annuityAmtIdx = FindCol(new[] { "Annuity Amount", "Annuity" }, 36);
            int autoDebitIdx = FindCol(new[] { "Auto Debit" }, 37);
            int bDateIdx = FindCol(new[] { "Bdate", "Birth Date" }, 38);

            _logger.LogInformation("Excel Import - Mapping: PNum={PN}, Holder={HN}, Prem={PR}, PlusOther={PO}, AddDetail={AD}", pNumIdx, hNameIdx, premIdx, plusOtherIdx, addDetailsIdx);

            DateTime AdvanceToFutureDate(DateTime date, string? type) {
                if (date >= DateTime.UtcNow) return date;
                var next = date;
                string t = type?.ToLower() ?? "monthly";
                while (next < DateTime.UtcNow) {
                    if (t.Contains("monthly")) next = next.AddMonths(1);
                    else if (t.Contains("quarterly")) next = next.AddMonths(3);
                    else if (t.Contains("half") || t.Contains("semi")) next = next.AddMonths(6);
                    else if (t.Contains("yearly") || t.Contains("annual")) next = next.AddYears(1);
                    else next = next.AddMonths(1); // Default to monthly
                }
                return next;
            }

            string CleanDecimal(string val) {
                if (string.IsNullOrWhiteSpace(val)) return "0";
                var clean = new string(val.Where(c => char.IsDigit(c) || c == '.' || c == '-').ToArray());
                int dotCount = clean.Count(x => x == '.');
                if (dotCount > 1) {
                    int lastDot = clean.LastIndexOf('.');
                    clean = clean.Substring(0, lastDot).Replace(".", "") + clean.Substring(lastDot);
                }
                return clean;
            }

            var policyTypes = await _context.PolicyTypes.ToListAsync();
            if (policyTypes.Count == 0)
            {
                var newType = new Models.PolicyType { Name = "General", Description = "Auto-created default type", IsActive = true };
                _context.PolicyTypes.Add(newType);
                await _context.SaveChangesAsync();
                policyTypes.Add(newType);
            }
            var defaultType = policyTypes.FirstOrDefault(t => t.IsActive) ?? policyTypes[0];
            int defaultTypeId = defaultType.Id;

            var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            var fallbackEmail = currentUser?.Email ?? "noreply@policymanager.com";

            var existingPolicyNumbers = await _context.Policies.Select(p => p.PolicyNumber).ToListAsync();
            var existingFamilyMembers = await _context.FamilyMembers.AsNoTracking().ToListAsync();
            var processedInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var newPolicies = new List<Policy>();

            for (int i = 0; i < dataTable.Rows.Count; i++)
            {
                var row = dataTable.Rows[i];
                string GetVal(int idx) => (idx >= 0 && idx < dataTable.Columns.Count) ? row[idx]?.ToString()?.Trim() ?? "" : "";
                string SafeTruncate(string? val, int max) => string.IsNullOrEmpty(val) ? "" : (val.Length > max ? val.Substring(0, max) : val);

                try
                {
                    var policyNumber = GetVal(pNumIdx);
                    if (string.IsNullOrWhiteSpace(policyNumber)) continue;

                    if (existingPolicyNumbers.Contains(policyNumber) || processedInFile.Contains(policyNumber)) {
                        result.SkippedCount++;
                        continue;
                    }

                    DateTime startDate = DateTime.UtcNow;
                    var sVal = GetVal(sDateIdx);
                    if (!string.IsNullOrEmpty(sVal)) {
                        if (DateTime.TryParse(sVal, out var ps)) startDate = ps;
                        else if (double.TryParse(sVal, out var serial)) startDate = DateTime.FromOADate(serial);
                    }

                    DateTime endDate = startDate.AddYears(1);
                    var eVal = GetVal(eDateIdx);
                    if (!string.IsNullOrEmpty(eVal)) {
                        if (DateTime.TryParse(eVal, out var pe)) endDate = pe;
                        else if (double.TryParse(eVal, out var serial)) endDate = DateTime.FromOADate(serial);
                    }

                    decimal premium = 0, coverage = 0, tax = 0, instAmt = 0, netPrem = 0, totMatAmt = 0, totalPaid = 0;
                    if (decimal.TryParse(CleanDecimal(GetVal(premIdx)), out var prm)) premium = prm;
                    if (decimal.TryParse(CleanDecimal(GetVal(covIdx)), out var cov)) coverage = cov;
                    if (decimal.TryParse(CleanDecimal(GetVal(taxIdx)), out var tx)) tax = tx;
                    if (decimal.TryParse(CleanDecimal(GetVal(instAmtIdx)), out var ia)) instAmt = ia;
                    if (decimal.TryParse(CleanDecimal(GetVal(netPremIdx)), out var np)) netPrem = np;
                    if (decimal.TryParse(CleanDecimal(GetVal(matAmtIdx)), out var ma)) totMatAmt = ma;

                    string rawTotalPaid = GetVal(totalPaidIdx);
                    if (!string.IsNullOrWhiteSpace(rawTotalPaid) && decimal.TryParse(CleanDecimal(rawTotalPaid), out var tp)) {
                        totalPaid = tp;
                    } else {
                        int paidCount = 0;
                        if (int.TryParse(GetVal(paidInstIdx), out var pc)) paidCount = pc;
                        else if (double.TryParse(GetVal(paidInstIdx), out var pcD)) paidCount = (int)pcD;
                        totalPaid = paidCount * (instAmt > 0 ? instAmt : (premium / 12));
                    }

                    DateTime? annuityDate = null;
                    var anVal = GetVal(annuityDateIdx);
                    if (!string.IsNullOrEmpty(anVal)) {
                        if (DateTime.TryParse(anVal, out var ad)) annuityDate = ad.ToUniversalTime();
                        else if (double.TryParse(anVal, out var serial)) annuityDate = DateTime.FromOADate(serial).ToUniversalTime();
                    }

                    decimal? annuityAmt = null;
                    if (decimal.TryParse(CleanDecimal(GetVal(annuityAmtIdx)), out var aa)) annuityAmt = aa;

                    string autoDebit = GetVal(autoDebitIdx);
                    string termYearsStr = GetVal(durIdx);
                    string payingTermStr = GetVal(payTermsIdx);

                    string instType = GetVal(instTypeIdx);
                    if (string.IsNullOrEmpty(instType)) instType = GetVal(payTermsIdx); 
                    DateTime? nextInstDate = null;
                    try {
                        var niVal = GetVal(nextInstIdx);
                        if (!string.IsNullOrEmpty(niVal)) {
                            if (DateTime.TryParse(niVal, out var ni)) nextInstDate = ni.ToUniversalTime();
                            else if (double.TryParse(niVal, out var serial)) nextInstDate = DateTime.FromOADate(serial).ToUniversalTime();
                            if (nextInstDate < DateTime.UtcNow.AddDays(-1)) {
                                nextInstDate = AdvanceToFutureDate(nextInstDate.Value, instType);
                            }
                        }
                    } catch { }

                    DateTime? maturityDate = null;
                    try {
                        var mdVal = GetVal(matDateIdx);
                        if (!string.IsNullOrEmpty(mdVal)) {
                            if (DateTime.TryParse(mdVal, out var md)) maturityDate = md.ToUniversalTime();
                            else if (double.TryParse(mdVal, out var serial)) maturityDate = DateTime.FromOADate(serial).ToUniversalTime();
                        }
                    } catch { }

                    int typeId = defaultTypeId;
                    var typeName = GetVal(pTypeIdx);
                    if (!string.IsNullOrEmpty(typeName)) {
                        var matchedType = policyTypes.FirstOrDefault(t => t.Name.Equals(typeName, StringComparison.OrdinalIgnoreCase));
                        if (matchedType != null) typeId = matchedType.Id;
                    }

                    string status = SafeTruncate(!string.IsNullOrEmpty(GetVal(stageIdx)) ? GetVal(stageIdx) : "Active", 50);
                    if (startDate.Date == endDate.Date && startDate.Year > 2000) status = "Completed";

                    string holderNameStr = SafeTruncate(GetVal(hNameIdx) ?? "Unspecified", 200);
                    int? matchedFamilyMemberId = null;
                    if (holderNameStr != "Unspecified") {
                        var familyMemberMatch = existingFamilyMembers.FirstOrDefault(fm => fm.Name.Equals(holderNameStr, StringComparison.OrdinalIgnoreCase));
                        if (familyMemberMatch != null) matchedFamilyMemberId = familyMemberMatch.Id;
                    }

                    var policy = new Policy
                    {
                        PolicyNumber = SafeTruncate(policyNumber, 50),
                        PolicyHolderName = holderNameStr,
                        FamilyMemberId = matchedFamilyMemberId,
                        Email = SafeTruncate(!string.IsNullOrEmpty(GetVal(emailIdx)) ? GetVal(emailIdx) : fallbackEmail, 1000),
                        PhoneNumber = SafeTruncate(GetVal(phoneIdx), 20),
                        PolicyTypeId = typeId,
                        PremiumAmount = premium,
                        CoverageAmount = coverage,
                        TotalPaidAmount = totalPaid,
                        StartDate = startDate,
                        EndDate = endDate,
                        Status = status,
                        SchemeName = SafeTruncate(GetVal(schemeIdx), 200),
                        CompanyName = SafeTruncate(GetVal(compIdx), 200),
                        ProductName = SafeTruncate(GetVal(prodNameIdx), 200),
                        LocationUnit = SafeTruncate(GetVal(locIdx), 200),
                        Duration = SafeTruncate(GetVal(durIdx), 100),
                        CoverageDescription = SafeTruncate(GetVal(covDescIdx), 1000),
                        TaxAmount = tax,
                        GstApplicable = SafeTruncate(GetVal(gstIdx), 10),
                        InstallmentAmount = instAmt,
                        NetPremium = netPrem,
                        BankAccountDetails = SafeTruncate(GetVal(bankIdx), 500),
                        AgentName = SafeTruncate(GetVal(agentIdx), 200),
                        AlternateContactNumber = SafeTruncate(GetVal(altPhoneIdx), 50),
                        SpecialRemarks = SafeTruncate(GetVal(remarksIdx), 1000),
                        MaturityDate = maturityDate,
                        TotalMaturityAmount = totMatAmt,
                        AdditionalDetails = SafeTruncate(GetVal(addDetailsIdx), 2000),
                        NomineeName = SafeTruncate(GetVal(nomineeIdx), 500),
                        NomineeRelation = SafeTruncate(GetVal(relationIdx), 200),
                        InstallmentType = SafeTruncate(instType, 100),
                        NextInstallmentDate = nextInstDate,
                        AnnuityDate = annuityDate,
                        AnnuityAmount = annuityAmt,
                        AutoDebit = SafeTruncate(autoDebit, 50),
                        TermYears = SafeTruncate(termYearsStr, 100),
                        PayingTerm = SafeTruncate(payingTermStr, 100),
                        CreatedAt = DateTime.UtcNow,
                        CreatedByUserId = userId
                    };

                    newPolicies.Add(policy);
                    processedInFile.Add(policyNumber);
                    result.ImportedPolicyNumbers.Add(policyNumber);
                    result.ImportedCount++;
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    result.Errors.Add($"Row {i + 1}: Processing error - {ex.Message}");
                }
            }

            if (newPolicies.Any())
            {
                await _context.Policies.AddRangeAsync(newPolicies);
                await _context.SaveChangesAsync();
                await _auditLogService.LogAsync("Import", "Policy", null, null, $"Imported {newPolicies.Count} policies via Excel", userId);
            }

            string finalMsg = $"Import summary: {result.ImportedCount} Imported, {result.SkippedCount} Skipped, {result.FailedCount} Failed.";
            return ApiResponse<ExcelUploadResultDto>.SuccessResponse(result, finalMsg);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FATAL: Error during Excel processing");
            return ApiResponse<ExcelUploadResultDto>.FailResponse($"Critical error reading file: {ex.Message}");
        }
    }
