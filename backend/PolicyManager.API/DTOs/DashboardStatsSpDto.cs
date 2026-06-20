namespace PolicyManager.API.DTOs
{
    public class DashboardStatsSpDto
    {
        public int TotalPolicies { get; set; }
        public int ActivePolicies { get; set; }
        public int ExpiredPolicies { get; set; }
        public int PendingPolicies { get; set; }
        public int CancelledPolicies { get; set; }
        public decimal TotalPremiumAmount { get; set; }
        public decimal TotalCoverageAmount { get; set; }
        public int OverdueCount { get; set; }
        public decimal OverdueAmount { get; set; }
    }
}
