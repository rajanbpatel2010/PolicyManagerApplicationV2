namespace PolicyManager.API.Helpers
{
    public static class PolicyConstants
    {
        // Policy Statuses
        public const string StatusActive = "Active";
        public const string StatusInactive = "Inactive";
        public const string StatusExpired = "Expired";
        public const string StatusCompleted = "Completed";
        public const string StatusLapsed = "Lapsed";
        public const string StatusCancelled = "Cancelled";
        public const string StatusPending = "Pending";

        // Installment Types
        public const string InstallmentMonthly = "Monthly";
        public const string InstallmentQuarterly = "Quarterly";
        public const string InstallmentHalfYearly = "Half-Yearly";
        public const string InstallmentYearly = "Yearly";
        public const string InstallmentOneTime = "One Time";

        // Audit Actions
        public const string ActionCreate = "Create";
        public const string ActionUpdate = "Update";
        public const string ActionDelete = "Delete";
        public const string ActionImport = "Import";
        public const string ActionPayment = "Payment";
        public const string ActionSync = "Sync";
        public const string ActionUpload = "Upload";

        // Roles
        public const string RoleAdmin = "Admin";
        public const string RoleUser = "User";
    }
}
